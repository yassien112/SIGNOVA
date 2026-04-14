const EMPTY_LABELS = new Set(['', 'none', 'null', 'unknown', 'no_gesture', 'idle']);

function normalizeLabel(label) {
  if (label === undefined || label === null) {
    return null;
  }

  const normalized = String(label).trim();
  if (!normalized) {
    return null;
  }

  return EMPTY_LABELS.has(normalized.toLowerCase()) ? null : normalized;
}

function clampScore(score) {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return 0;
  }

  if (numericScore < 0) {
    return 0;
  }

  if (numericScore > 1) {
    return 1;
  }

  return numericScore;
}

function normalizeTimestamp(timestamp) {
  const numericTimestamp = Number(timestamp);
  return Number.isFinite(numericTimestamp) && numericTimestamp > 0 ? numericTimestamp : Date.now();
}

function capitalizeLeadingWord(text) {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function appendToken(text, token) {
  if (!token) {
    return text;
  }

  if (!text) {
    return token;
  }

  const separator = /[.!?]$/.test(text) ? ' ' : ' ';
  return `${text}${separator}${token}`;
}

function finalizeSentence(text) {
  if (!text || /[.!?]$/.test(text)) {
    return text;
  }

  return `${text}.`;
}

function formatTokenForSentence(text, token) {
  if (!text || /[.!?]$/.test(text)) {
    return capitalizeLeadingWord(token);
  }

  return token;
}

export class SignLanguageSession {
  constructor({ sessionId, config, metadata = {} }) {
    this.sessionId = sessionId;
    this.config = config;
    this.metadata = metadata;
    this.samples = [];
    this.committedText = '';
    this.pendingLabel = null;
    this.pendingSince = 0;
    this.lastCommittedLabel = null;
    this.lastCommittedAt = 0;
    this.lastSignalAt = 0;
    this.lastActivityAt = Date.now();
    this.processedPredictions = 0;
  }

  ingestPredictions(predictions) {
    let snapshot = this.getSnapshot();

    for (const prediction of predictions) {
      snapshot = this.ingestPrediction(prediction);
    }

    return snapshot;
  }

  ingestPrediction(prediction) {
    const startedAt = performance.now();
    const normalizedPrediction = {
      label: normalizeLabel(prediction?.label),
      score: clampScore(prediction?.score),
      timestamp: normalizeTimestamp(prediction?.timestamp)
    };

    this.lastActivityAt = Date.now();
    this.processedPredictions += 1;

    if (
      this.committedText &&
      this.lastSignalAt &&
      normalizedPrediction.timestamp - this.lastSignalAt >= this.config.phrasePauseMs
    ) {
      this.committedText = finalizeSentence(this.committedText);
    }

    this.samples.push(normalizedPrediction);
    this.pruneSamples(normalizedPrediction.timestamp);

    if (normalizedPrediction.label) {
      this.lastSignalAt = normalizedPrediction.timestamp;
    }

    const aggregate = this.buildAggregate(normalizedPrediction.timestamp);
    this.advanceState(aggregate, normalizedPrediction.timestamp);

    return this.getSnapshot({
      aggregate,
      serverProcessingMs: Number((performance.now() - startedAt).toFixed(2)),
      referenceTimestamp: normalizedPrediction.timestamp
    });
  }

  pruneSamples(now) {
    const minTimestamp = now - this.config.stabilizationWindowMs;
    this.samples = this.samples.filter((sample) => sample.timestamp >= minTimestamp);
  }

  buildAggregate(now) {
    const labelStats = new Map();
    let activeWeight = 0;
    let blankWeight = 0;

    for (const sample of this.samples) {
      const age = Math.max(0, now - sample.timestamp);
      const recencyFactor = Math.max(0.25, 1 - age / this.config.stabilizationWindowMs);
      const confidenceFactor = Math.max(0.15, sample.score);
      const weight = confidenceFactor * recencyFactor;

      if (!sample.label) {
        blankWeight += weight;
        continue;
      }

      activeWeight += weight;

      const current = labelStats.get(sample.label) ?? {
        label: sample.label,
        hits: 0,
        weight: 0,
        scoreSum: 0,
        bestScore: 0
      };

      current.hits += 1;
      current.weight += weight;
      current.scoreSum += sample.score;
      current.bestScore = Math.max(current.bestScore, sample.score);
      labelStats.set(sample.label, current);
    }

    const rankedLabels = [...labelStats.values()].sort((left, right) => right.weight - left.weight);
    const best = rankedLabels[0] ?? null;

    if (!best || activeWeight === 0) {
      return {
        activeWeight,
        blankWeight,
        bestLabel: null,
        confidence: 0,
        support: 0,
        hits: 0,
        isStable: false
      };
    }

    const confidence = best.scoreSum / best.hits;
    const support = best.weight / activeWeight;
    const isStable =
      best.hits >= this.config.minOccurrences &&
      confidence >= this.config.minConfidence &&
      support >= this.config.minSupport;

    return {
      activeWeight,
      blankWeight,
      bestLabel: best.label,
      confidence,
      support,
      hits: best.hits,
      isStable
    };
  }

  advanceState(aggregate, now) {
    if (!aggregate.bestLabel || !aggregate.isStable) {
      if (aggregate.blankWeight >= aggregate.activeWeight) {
        this.pendingLabel = null;
        this.pendingSince = 0;
      }

      return;
    }

    if (this.pendingLabel !== aggregate.bestLabel) {
      this.pendingLabel = aggregate.bestLabel;
      this.pendingSince = this.getFirstSeenTimestamp(aggregate.bestLabel) ?? now;
    }

    const isHeldLongEnough = now - this.pendingSince >= this.config.commitHoldMs;
    const isDuplicate =
      this.lastCommittedLabel === aggregate.bestLabel &&
      now - this.lastCommittedAt < this.config.duplicateCooldownMs;

    if (!isHeldLongEnough || isDuplicate) {
      return;
    }

    const formattedToken = formatTokenForSentence(this.committedText, aggregate.bestLabel);
    this.committedText = appendToken(this.committedText, formattedToken);
    this.lastCommittedLabel = aggregate.bestLabel;
    this.lastCommittedAt = now;
    this.pendingLabel = null;
    this.pendingSince = 0;
    this.samples = this.samples.filter(
      (sample) => !sample.label || sample.label !== aggregate.bestLabel
    );
  }

  getFirstSeenTimestamp(label) {
    const matchingSamples = this.samples.filter((sample) => sample.label === label);

    if (matchingSamples.length === 0) {
      return null;
    }

    return matchingSamples[0].timestamp;
  }

  reset() {
    this.samples = [];
    this.committedText = '';
    this.pendingLabel = null;
    this.pendingSince = 0;
    this.lastCommittedLabel = null;
    this.lastCommittedAt = 0;
    this.lastSignalAt = 0;
    this.lastActivityAt = Date.now();
    this.processedPredictions = 0;

    return this.getSnapshot();
  }

  getSnapshot({ aggregate = null, serverProcessingMs = 0, referenceTimestamp = Date.now() } = {}) {
    const currentAggregate = aggregate ?? this.buildAggregate(referenceTimestamp);
    const previewToken =
      currentAggregate.bestLabel &&
      (!this.lastCommittedLabel ||
        this.lastCommittedLabel !== currentAggregate.bestLabel ||
        referenceTimestamp - this.lastCommittedAt >= this.config.duplicateCooldownMs)
        ? formatTokenForSentence(this.committedText, currentAggregate.bestLabel)
        : '';

    const displayText =
      previewToken && !this.committedText.endsWith(previewToken)
        ? appendToken(this.committedText, previewToken)
        : this.committedText;

    return {
      sessionId: this.sessionId,
      committedText: this.committedText,
      displayText,
      previewToken,
      confidence: Number((currentAggregate.confidence || 0).toFixed(3)),
      support: Number((currentAggregate.support || 0).toFixed(3)),
      isStable: currentAggregate.isStable,
      processedPredictions: this.processedPredictions,
      serverProcessingMs,
      updatedAt: new Date().toISOString()
    };
  }
}
