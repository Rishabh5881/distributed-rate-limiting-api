const redisClient = require("../config/redis");

const rateLimiter = (limit, windowMs) => {
  return async (req, res, next) => {
   const clientIp = req.ip;
   const userId = req.headers["x-user-id"];
   const key = userId
   ? `rate-limit:user:${userId}`
   : `rate-limit:ip:${clientIp}`;

    const now = Date.now();
    const cutoff = now - windowMs;

    const requestId = `${now}-${Math.random()}`;

    await redisClient.zRemRangeByScore(key, 0, cutoff);

    const requestCount = await redisClient.zCard(key);
    res.set("X-RateLimit-Limit", limit);
    res.set("X-RateLimit-Remaining", Math.max(0, limit - requestCount - 1));
    res.set(
    "X-RateLimit-Reset",
    Math.ceil(windowMs / 1000)
    );

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