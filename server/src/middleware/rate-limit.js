// Minimal in-memory sliding-window rate limiter. Good enough for a single-process
// deployment; swap for a shared store (e.g. Redis) if you scale to multiple instances.
function rateLimit({ windowMs, max }) {
  const hits = new Map();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of hits) {
      const kept = timestamps.filter((t) => t > cutoff);
      if (kept.length) hits.set(key, kept);
      else hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(key) || []).filter((t) => t > cutoff);
    if (timestamps.length >= max) {
      return res.status(429).json({ error: "Za dużo prób. Spróbuj ponownie za chwilę." });
    }
    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}

module.exports = { rateLimit };
