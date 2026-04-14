import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Send, CheckCircle, Zap } from 'lucide-react';
import { io } from 'socket.io-client';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { SIGN_LANGUAGE_SOCKET_URL } from '../lib/config';

const customGestureMap = {
  Closed_Fist: 'Stop',
  Open_Palm: 'Hello',
  Pointing_Up: 'Look',
  Thumb_Down: 'Bad',
  Thumb_Up: 'Good',
  Victory: 'Peace',
  ILoveYou: 'I Love You',
  None: null
};

const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: 'user',
    width: { ideal: 640, max: 960 },
    height: { ideal: 360, max: 540 },
    frameRate: { ideal: 24, max: 30 }
  },
  audio: false
};

const PREDICTION_FLUSH_MS = 45;
const MIN_INFERENCE_INTERVAL_MS = 40;
const FALLBACK_DUPLICATE_WINDOW_MS = 900;

function getTopPrediction(results) {
  if (!results?.gestures?.length || !results.gestures[0]?.length) {
    return {
      label: null,
      score: 0,
      timestamp: Date.now()
    };
  }

  const topCategory = results.gestures[0][0];
  const mappedLabel = customGestureMap[topCategory.categoryName] ?? topCategory.categoryName;

  return {
    label: mappedLabel,
    score: topCategory.score ?? 0,
    timestamp: Date.now()
  };
}

function drawBoundingBox(results, canvas) {
  const canvasContext = canvas?.getContext('2d');

  if (!canvas || !canvasContext) {
    return;
  }

  canvasContext.save();
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  if (results?.landmarks?.length) {
    const landmarks = results.landmarks[0];
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;

    landmarks.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    const padding = 20;
    const boxX = minX * canvas.width - padding;
    const boxY = minY * canvas.height - padding;
    const boxWidth = (maxX - minX) * canvas.width + padding * 2;
    const boxHeight = (maxY - minY) * canvas.height + padding * 2;

    canvasContext.strokeStyle = '#10B981';
    canvasContext.lineWidth = 4;
    canvasContext.strokeRect(boxX, boxY, boxWidth, boxHeight);
  }

  canvasContext.restore();
}

const AICamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gestureRecognizerRef = useRef(null);
  const socketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const animationFrameRef = useRef(null);
  const videoFrameCallbackRef = useRef(null);
  const flushTimerRef = useRef(null);
  const predictionBufferRef = useRef([]);
  const latestTextRef = useRef('');
  const lastVideoTimeRef = useRef(-1);
  const lastInferenceAtRef = useRef(0);
  const isCapturingRef = useRef(false);
  const isProcessingFrameRef = useRef(false);
  const fallbackStateRef = useRef({ lastLabel: null, lastCommittedAt: 0 });

  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState('Loading AI models...');
  const [isModelReady, setIsModelReady] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const applySnapshot = (snapshot) => {
    const nextText = snapshot?.displayText || snapshot?.committedText || '';
    const nextConfidence = Math.round((snapshot?.confidence || 0) * 100);

    latestTextRef.current = nextText;
    setDetectedText(nextText);
    setConfidence(nextConfidence);

    if (snapshot?.previewToken) {
      setStatus('Realtime translation active. Interpreting continuous signs...');
      return;
    }

    if (snapshot?.committedText) {
      setStatus('Realtime translation active.');
      return;
    }

    setStatus(isCapturingRef.current ? 'Camera running. Waiting for a clear sign...' : 'Ready.');
  };

  const startRealtimeSession = () => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      return;
    }

    socket.emit(
      'sign:session:start',
      { source: 'ai-camera' },
      (response) => {
        if (!response?.ok || !response.snapshot) {
          setStatus('Realtime backend unavailable. Using local fallback recognition.');
          return;
        }

        sessionIdRef.current = response.snapshot.sessionId;
        applySnapshot(response.snapshot);
      }
    );
  };

  const flushPredictions = () => {
    flushTimerRef.current = null;

    const socket = socketRef.current;
    const sessionId = sessionIdRef.current;

    if (!socket?.connected || !sessionId || predictionBufferRef.current.length === 0) {
      return;
    }

    const predictions = predictionBufferRef.current.splice(0, predictionBufferRef.current.length);

    socket.emit('sign:frame', {
      sessionId,
      predictions
    });
  };

  const queuePrediction = (prediction) => {
    predictionBufferRef.current.push(prediction);

    if (!flushTimerRef.current) {
      flushTimerRef.current = window.setTimeout(flushPredictions, PREDICTION_FLUSH_MS);
    }
  };

  const applyLocalFallback = (prediction) => {
    if (!prediction.label || prediction.score < 0.7) {
      return;
    }

    const now = prediction.timestamp;
    const { lastLabel, lastCommittedAt } = fallbackStateRef.current;

    if (lastLabel === prediction.label && now - lastCommittedAt < FALLBACK_DUPLICATE_WINDOW_MS) {
      return;
    }

    fallbackStateRef.current = {
      lastLabel: prediction.label,
      lastCommittedAt: now
    };

    setDetectedText((previousText) =>
      previousText ? `${previousText} ${prediction.label}` : prediction.label
    );
    setConfidence(Math.round(prediction.score * 100));
    setStatus('Realtime backend unavailable. Using local fallback recognition.');
  };

  const processPrediction = (prediction) => {
    const socket = socketRef.current;

    if (!socket?.connected || !sessionIdRef.current) {
      applyLocalFallback(prediction);
      return;
    }

    queuePrediction(prediction);
  };

  const scheduleNextFrame = () => {
    const videoElement = videoRef.current;

    if (!isCapturingRef.current || !videoElement) {
      return;
    }

    if (typeof videoElement.requestVideoFrameCallback === 'function') {
      videoFrameCallbackRef.current = videoElement.requestVideoFrameCallback(() => {
        processFrame();
      });
      return;
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      processFrame();
    });
  };

  const processFrame = () => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const recognizer = gestureRecognizerRef.current;

    if (
      !isCapturingRef.current ||
      !videoElement ||
      !canvasElement ||
      !recognizer ||
      videoElement.readyState < 2
    ) {
      scheduleNextFrame();
      return;
    }

    const now = performance.now();

    if (
      isProcessingFrameRef.current ||
      videoElement.currentTime === lastVideoTimeRef.current ||
      now - lastInferenceAtRef.current < MIN_INFERENCE_INTERVAL_MS
    ) {
      scheduleNextFrame();
      return;
    }

    isProcessingFrameRef.current = true;
    lastInferenceAtRef.current = now;

    try {
      lastVideoTimeRef.current = videoElement.currentTime;

      const results = recognizer.recognizeForVideo(videoElement, now);
      drawBoundingBox(results, canvasElement);
      processPrediction(getTopPrediction(results));
    } finally {
      isProcessingFrameRef.current = false;
      scheduleNextFrame();
    }
  };

  const stopCamera = () => {
    isCapturingRef.current = false;
    setIsCapturing(false);

    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (
      videoFrameCallbackRef.current &&
      videoRef.current &&
      typeof videoRef.current.cancelVideoFrameCallback === 'function'
    ) {
      videoRef.current.cancelVideoFrameCallback(videoFrameCallbackRef.current);
      videoFrameCallbackRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    predictionBufferRef.current = [];
    sessionIdRef.current = null;
    socketRef.current?.emit('sign:session:stop');

    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setConfidence(0);
    setStatus('Camera stopped.');
  };

  const handleClearTranslation = () => {
    latestTextRef.current = '';
    fallbackStateRef.current = { lastLabel: null, lastCommittedAt: 0 };
    setDetectedText('');
    setConfidence(0);

    if (socketRef.current?.connected && sessionIdRef.current) {
      socketRef.current.emit('sign:reset', { sessionId: sessionIdRef.current });
      return;
    }

    setStatus(isCapturingRef.current ? 'Camera running. Waiting for a clear sign...' : 'Ready.');
  };

  const startCamera = async () => {
    if (!gestureRecognizerRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      const videoElement = videoRef.current;

      if (!videoElement) {
        return;
      }

      videoElement.srcObject = stream;
      await videoElement.play();

      if (canvasRef.current) {
        canvasRef.current.width = videoElement.videoWidth || 640;
        canvasRef.current.height = videoElement.videoHeight || 360;
      }

      lastVideoTimeRef.current = -1;
      lastInferenceAtRef.current = 0;
      predictionBufferRef.current = [];
      fallbackStateRef.current = { lastLabel: null, lastCommittedAt: 0 };
      latestTextRef.current = '';

      setDetectedText('');
      setConfidence(0);
      setIsCapturing(true);
      isCapturingRef.current = true;

      if (socketRef.current?.connected) {
        startRealtimeSession();
      }

      setStatus('Camera running. Starting realtime translation...');
      scheduleNextFrame();
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatus('Camera access denied.');
    }
  };

  const handleSendToChat = () => {
    alert(`Message sent to chat: ${detectedText}`);
    handleClearTranslation();
  };

  useEffect(() => {
    const socket = io(SIGN_LANGUAGE_SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsRealtimeConnected(true);

      if (isModelReady || gestureRecognizerRef.current) {
        setStatus((currentStatus) =>
          currentStatus === 'Loading AI models...'
            ? currentStatus
            : 'Realtime backend connected.'
        );
      }

      if (isCapturingRef.current) {
        startRealtimeSession();
      }
    });

    socket.on('disconnect', () => {
      setIsRealtimeConnected(false);
      sessionIdRef.current = null;

      if (isCapturingRef.current) {
        setStatus('Realtime backend disconnected. Using local fallback recognition.');
      }
    });

    socket.on('sign:translation:update', (snapshot) => {
      applySnapshot(snapshot);
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });

        gestureRecognizerRef.current = recognizer;
        setIsModelReady(true);
        setStatus('Ready.');
      } catch (error) {
        console.error('Error loading MediaPipe:', error);
        setStatus('Error loading AI models.');
      }
    };

    initializeMediaPipe();

    return () => {
      stopCamera();
      gestureRecognizerRef.current?.close();
    };
  }, []);

  return (
    <div className="ai-camera-container">
      <div className="ai-header">
        <h2>AI Sign Language Translator</h2>
        <p>Low-latency sign recognition with backend sentence smoothing</p>
        <div className="status-row">
          <span className="status-text">{status}</span>
          <span className={`backend-pill ${isRealtimeConnected ? 'online' : 'offline'}`}>
            <Zap size={14} />
            {isRealtimeConnected ? 'Realtime backend online' : 'Realtime backend offline'}
          </span>
        </div>
      </div>

      <div className="camera-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
          width="640"
          height="360"
        />
        <canvas ref={canvasRef} className="detection-canvas" width="640" height="360" />

        {!isCapturing && (
          <div className="camera-overlay">
            <Camera size={48} className="camera-icon" />
            <button className="btn-primary start-btn" onClick={startCamera} disabled={!isModelReady}>
              {isModelReady ? 'Start Recognition' : 'Loading Model...'}
            </button>
          </div>
        )}
      </div>

      <div className="controls-panel">
        <div className="translation-box">
          <span className="label">Detected Translation:</span>
          <div className="translation-text">{detectedText || 'Waiting for signs...'}</div>
          {confidence > 0 && isCapturing && (
            <div className="confidence-badge">
              <CheckCircle size={14} /> Confidence: {confidence}%
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button className="btn-secondary" onClick={handleClearTranslation}>
            <RefreshCw size={18} /> Clear
          </button>
          <button className="btn-primary" disabled={!detectedText} onClick={handleSendToChat}>
            <Send size={18} /> Send to Chat
          </button>
          <button className="btn-danger" onClick={stopCamera} disabled={!isCapturing}>
            Stop Camera
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .ai-camera-container { max-width: 800px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
        .ai-header { text-align: center; }
        .ai-header h2 { font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem; }
        .ai-header p { color: var(--text-secondary); }
        .status-row { display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem; }
        .status-text { font-size: 0.9rem; color: #a1a1aa; }
        .backend-pill { display: inline-flex; align-items: center; gap: 0.35rem; border-radius: 999px; padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight: 600; }
        .backend-pill.online { background: rgba(16, 185, 129, 0.16); color: #34d399; }
        .backend-pill.offline { background: rgba(239, 68, 68, 0.14); color: #f87171; }
        .camera-wrapper { position: relative; background-color: var(--bg-secondary); border-radius: 12px; overflow: hidden; border: 2px solid var(--border-color); display: flex; justify-content: center; align-items: center; min-height: 360px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .video-feed { object-fit: cover; width: 100%; height: 100%; transform: scaleX(-1); }
        .detection-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; transform: scaleX(-1); }
        .camera-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); z-index: 20; gap: 1.5rem; }
        .camera-icon { color: var(--text-secondary); opacity: 0.5; }
        .controls-panel { background-color: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1.5rem; }
        .translation-box { background-color: var(--bg-main); padding: 1rem; border-radius: 8px; min-height: 100px; border: 1px solid var(--border-color); position: relative; }
        .label { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .translation-text { margin-top: 0.5rem; font-size: 1.5rem; font-weight: 500; }
        .confidence-badge { position: absolute; top: 1rem; right: 1rem; background: rgba(16, 185, 129, 0.2); color: var(--success, #10B981); padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
        .action-buttons { display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap; }
        .btn-primary, .btn-secondary, .btn-danger { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 1rem; transition: all 0.2s ease; cursor: pointer; }
        .btn-primary { background-color: var(--primary, #3b82f6); color: white; border: none; }
        .btn-primary:hover:not(:disabled) { background-color: var(--primary-hover, #2563eb); transform: translateY(-2px); }
        .btn-secondary { background-color: transparent; border: 1px solid var(--border-color); color: var(--text-primary); }
        .btn-secondary:hover { background-color: rgba(255,255,255,0.05); }
        .btn-danger { background-color: transparent; border: 1px solid var(--danger, #ef4444); color: var(--danger, #ef4444); }
        .btn-danger:hover:not(:disabled) { background-color: var(--danger, #ef4444); color: white; }
        button:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
      `}</style>
    </div>
  );
};

export default AICamera;
