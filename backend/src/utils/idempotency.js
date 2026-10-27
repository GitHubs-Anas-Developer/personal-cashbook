/**
 * In-memory / cache-based idempotency lock tracker to prevent race conditions
 * and double-submission of transactions within a short window.
 * In a multi-node production deployment, this would be backed by Redis.
 */
const pendingKeys = new Map();
const IDEMPOTENCY_TTL_MS = 60 * 1000; // 60 seconds

export const idempotencyManager = {
  /**
   * Acquire a lock for an idempotency key scoped to a user.
   * @param {string} userId
   * @param {string} key
   * @returns {boolean} true if acquired, false if already in progress
   */
  acquire(userId, key) {
    if (!key) return true;
    const lockKey = `${userId}:${key}`;
    const existing = pendingKeys.get(lockKey);
    const now = Date.now();

    if (existing && now - existing.timestamp < IDEMPOTENCY_TTL_MS) {
      return false;
    }

    pendingKeys.set(lockKey, { timestamp: now, status: 'processing' });
    return true;
  },

  /**
   * Release or resolve an idempotency key with its result.
   * @param {string} userId
   * @param {string} key
   * @param {any} result
   */
  resolve(userId, key, result = null) {
    if (!key) return;
    const lockKey = `${userId}:${key}`;
    pendingKeys.set(lockKey, { timestamp: Date.now(), status: 'resolved', result });
  },

  /**
   * Get cached result for an idempotency key if already resolved.
   * @param {string} userId
   * @param {string} key
   * @returns {any|null}
   */
  getCached(userId, key) {
    if (!key) return null;
    const lockKey = `${userId}:${key}`;
    const record = pendingKeys.get(lockKey);
    if (record && record.status === 'resolved') {
      return record.result;
    }
    return null;
  },

  /**
   * Clear an idempotency key in case of processing error.
   */
  release(userId, key) {
    if (!key) return;
    const lockKey = `${userId}:${key}`;
    pendingKeys.delete(lockKey);
  }
};

// Cleanup stale keys every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of pendingKeys.entries()) {
    if (now - record.timestamp > IDEMPOTENCY_TTL_MS * 5) {
      pendingKeys.delete(key);
    }
  }
}, 5 * 60 * 1000);
