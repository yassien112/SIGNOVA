import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { SIGN_LANGUAGE_SOCKET_URL } from '../lib/config';

const GESTURE_MAP = {
  Closed_Fist: 'Stop',
  Open_Palm: 'Hello',
  Pointing_Up: 'Look',
  Thumb_Down: 'Bad',
  Thumb_Up: 'Good',
  Victory: 'Peace',
  ILoveYou: 'I Love You',
  None: null,
};

const CAM = {
  video: {
    facingMode: 'user',
    width: { ideal: 640 },
    height: { ideal: 360 },
    frameRate: { ideal: 24 },
  },
  audio: false,
};

const FLUSH_MS = 45;
const MIN_INTERVAL_MS = 40;
const FALLBACK_WINDOW_MS = 900;

function getTop(results) {
  if (!results?.gestures?.[0]?.[0])
    return { label: null, score: 0, timestamp: Date.now() };
  const top = results.gestures[0][0];
  return {
    label: GESTURE_MAP[top.categoryName] ?? top.categoryName,
    score: top.score ?? 0,
    timestamp: Date.now(),
  };
}

function drawBox(results, canvas) {
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (results?.landmarks?.[0]) {
    const pts = results.landmarks[0];
    let minX = 1,
      minY = 1,
      maxX = 0,
      maxY = 0;
    pts.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    const pad = 20;
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      minX * canvas.width - pad,
      minY * canvas.height - pad,
      (maxX - minX) * canvas.width + pad * 2,
      (maxY - minY) * canvas.height + pad * 2,
    );
  }
  ctx.restore();
}

export function useAICamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognizer = useRef(null);
  const socketRef = useRef(null);
  const sessionId = useRef(null);
  const rafRef = useRef(null);
  const vfcRef = useRef(null);
  const flushTimer = useRef(null);
  const buffer = useRef([]);
  const latestText = useRef('');
  const lastTime = useRef(-1);
  const lastInfer = useRef(0);
  const capturing = useRef(false);
  const processing = useRef(false);
  const fallback = useRef({ lastLabel: null, lastAt: 0 });

  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState('Loading AI models...');
  const [modelReady, setModelReady] = useState(false);
  const [rtConnected, setRtConnected] = useState(false);

  /* ── snapshot → state ── */
  const applySnapshot = useCallback((snap) => {
    const text = snap?.displayText || snap?.committedText || '';
    latestText.current = text;
    setDetectedText(text);
    setConfidence(Math.round((snap?.confidence || 0) * 100));
    if (snap?.previewToken) {
      setStatus(
        'Realtime translation active. Interpreting continuous signs...',
      );
      return;
    }
    if (snap?.committedText) {
      setStatus('Realtime translation active.');
      return;
    }
    setStatus(
      capturing.current
        ? 'Camera running. Waiting for a clear sign...'
        : 'Ready.',
    );
  }, []);

  /* ── socket setup ── */
  useEffect(() => {
    const socket = io(SIGN_LANGUAGE_SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setRtConnected(true);
      if (capturing.current) startSession(socket);
    });
    socket.on('disconnect', () => {
      setRtConnected(false);
      sessionId.current = null;
      if (capturing.current)
        setStatus('Realtime backend disconnected. Using local fallback.');
    });
    socket.on('sign:translation:update', applySnapshot);
    return () => socket.close();
  }, []);

  /* ── MediaPipe init ── */
  useEffect(() => {
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );
        recognizer.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
        setModelReady(true);
        setStatus('Ready.');
      } catch {
        setStatus('Error loading AI models.');
      }
    })();
    return () => {
      stopCamera();
      recognizer.current?.close();
    };
  }, []);

  /* ── helpers ── */
  function startSession(socket) {
    if (!socket?.connected) return;
    socket.emit('sign:session:start', { source: 'ai-camera' }, (res) => {
      if (!res?.ok) {
        setStatus('Realtime backend unavailable. Using local fallback.');
        return;
      }
      sessionId.current = res.snapshot.sessionId;
      applySnapshot(res.snapshot);
    });
  }

  function flush() {
    flushTimer.current = null;
    const socket = socketRef.current;
    if (!socket?.connected || !sessionId.current || buffer.current.length === 0)
      return;
    const preds = buffer.current.splice(0);
    socket.emit('sign:frame', {
      sessionId: sessionId.current,
      predictions: preds,
    });
  }

  function queue(pred) {
    buffer.current.push(pred);
    if (!flushTimer.current)
      flushTimer.current = window.setTimeout(flush, FLUSH_MS);
  }

  function applyFallback(pred) {
    if (!pred.label || pred.score < 0.7) return;
    const { lastLabel, lastAt } = fallback.current;
    if (
      lastLabel === pred.label &&
      pred.timestamp - lastAt < FALLBACK_WINDOW_MS
    )
      return;
    fallback.current = { lastLabel: pred.label, lastAt: pred.timestamp };
    setDetectedText((p) => (p ? `${p} ${pred.label}` : pred.label));
    setConfidence(Math.round(pred.score * 100));
    setStatus('Realtime backend unavailable. Using local fallback.');
  }

  function processPred(pred) {
    const socket = socketRef.current;
    if (!socket?.connected || !sessionId.current) {
      applyFallback(pred);
      return;
    }
    queue(pred);
  }

  function scheduleNext() {
    if (!capturing.current || !videoRef.current) return;
    if (typeof videoRef.current.requestVideoFrameCallback === 'function') {
      vfcRef.current = videoRef.current.requestVideoFrameCallback(() =>
        processFrame(),
      );
    } else {
      rafRef.current = requestAnimationFrame(() => processFrame());
    }
  }

  function processFrame() {
    const vid = videoRef.current;
    const can = canvasRef.current;
    const rec = recognizer.current;
    if (!capturing.current || !vid || !can || !rec || vid.readyState < 2) {
      scheduleNext();
      return;
    }
    const now = performance.now();
    if (
      processing.current ||
      vid.currentTime === lastTime.current ||
      now - lastInfer.current < MIN_INTERVAL_MS
    ) {
      scheduleNext();
      return;
    }
    processing.current = true;
    lastInfer.current = now;
    try {
      lastTime.current = vid.currentTime;
      const results = rec.recognizeForVideo(vid, now);
      drawBox(results, can);
      processPred(getTop(results));
    } finally {
      processing.current = false;
      scheduleNext();
    }
  }

  /* ── public API ── */
  const stopCamera = useCallback(() => {
    capturing.current = false;
    setIsCapturing(false);
    if (flushTimer.current) {
      window.clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (vfcRef.current && videoRef.current?.cancelVideoFrameCallback) {
      videoRef.current.cancelVideoFrameCallback(vfcRef.current);
      vfcRef.current = null;
    }
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    buffer.current = [];
    sessionId.current = null;
    socketRef.current?.emit('sign:session:stop');
    canvasRef.current
      ?.getContext('2d')
      ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setConfidence(0);
    setStatus('Camera stopped.');
  }, []);

  const startCamera = useCallback(async () => {
    if (!recognizer.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAM);
      const vid = videoRef.current;
      if (!vid) return;

      vid.srcObject = stream;

      // ✅ استنى الـ metadata تتحمل الأول
      await new Promise((resolve) => {
        vid.onloadedmetadata = () => {
          vid.play().then(resolve);
        };
      });

      // ✅ دلوقتي videoWidth/Height صح
      if (canvasRef.current) {
        canvasRef.current.width = vid.videoWidth || 640;
        canvasRef.current.height = vid.videoHeight || 360;
      }

      lastTime.current = -1;
      lastInfer.current = 0;
      buffer.current = [];
      fallback.current = { lastLabel: null, lastAt: 0 };
      latestText.current = '';
      setDetectedText('');
      setConfidence(0);
      setIsCapturing(true);
      capturing.current = true;
      if (socketRef.current?.connected) startSession(socketRef.current);
      setStatus('Camera running. Starting realtime translation...');
      scheduleNext();
    } catch {
      setStatus('Camera access denied.');
    }
  }, []);

  const clearTranslation = useCallback(() => {
    latestText.current = '';
    fallback.current = { lastLabel: null, lastAt: 0 };
    setDetectedText('');
    setConfidence(0);
    if (socketRef.current?.connected && sessionId.current) {
      socketRef.current.emit('sign:reset', { sessionId: sessionId.current });
    } else {
      setStatus(
        capturing.current
          ? 'Camera running. Waiting for a clear sign...'
          : 'Ready.',
      );
    }
  }, []);

  return {
    videoRef,
    canvasRef,
    isCapturing,
    detectedText,
    confidence,
    status,
    modelReady,
    rtConnected,
    startCamera,
    stopCamera,
    clearTranslation,
    getLatestText: () => latestText.current,
  };
}
