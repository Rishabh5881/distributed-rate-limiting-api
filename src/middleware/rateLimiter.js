const redisClient = require("../config/redis");

const rateLimiter = (limit, windowMs) => {
  const key = "rate-limit:global";

  return async (req, res, next) => {
    const now = Date.now();
    const cutoff = now - windowMs;

    const requestId = `${now}-${Math.random()}`;

    await redisClient.zRemRangeByScore(key, 0, cutoff);

    const requestCount = await redisClient.zCard(key);

    console.log("Request count:", requestCount);

    if (requestCount >= limit) {
      const oldestRequest = await redisClient.zRangeWithScores(key, 0, 0);

      const retryAfter = Math.ceil(
        (oldestRequest[0].score + windowMs - now) / 1000
      );

      res.set("Retry-After", retryAfter);

      return res.status(429).json({
        success: false,
        message: "Too many requests",
        retryAfter,
      });
    }

    await redisClient.zAdd(key, {
      score: now,
      value: requestId,
    });

    next();
  };
};

module.exports = rateLimiter;