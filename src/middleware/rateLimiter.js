const redisClient = require("../config/redis");

const rateLimiter = (limit, windowMs) => {
  const key = "rate-limit:global";

  return async (req, res, next) => {
    const now = Date.now();
    const cutoff = now - windowMs;

    const requestId = `${now}-${Math.random()}`;

    const results = await redisClient
      .multi()
      .zRemRangeByScore(key, 0, cutoff)
      .zAdd(key, {
        score: now,
        value: requestId,
      })
      .zCard(key)
      .zRangeWithScores(key, 0, 0)
      .exec();

    const requestCount = results[2];
    const oldestRequest = results[3][0];

    console.log("Request count:", requestCount);

    if (requestCount > limit) {
      const retryAfter = Math.ceil(
        (oldestRequest.score + windowMs - now) / 1000
      );

      res.set("Retry-After", retryAfter);

      return res.status(429).json({
        success: false,
        message: "Too many requests",
        retryAfter,
      });
    }

    next();
  };
};

module.exports = rateLimiter;