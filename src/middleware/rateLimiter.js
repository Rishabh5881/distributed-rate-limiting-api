const rateLimiter = (limit, windowMs) => {
  const requests = [];
  return (req, res, next) => {
    const now = Date.now();

    requests.push(now);

    while (
      requests.length > 0 &&
      requests[0] <= now - windowMs
    ) {
      requests.shift();
    }

    console.log("Request count:", requests.length);

    if (requests.length > limit) {
      const retryAfter = Math.ceil(
        (requests[0] + windowMs - now) / 1000
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