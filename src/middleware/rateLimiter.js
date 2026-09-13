const requests = [];

const rateLimiter = (req, res, next) => {
  const now = Date.now();
  const windowMs = 10 * 1000;
 

  requests.push(now);
  while (requests.length > 0 && requests[0] <= now - windowMs) {
  requests.shift();
  }
  const limit = 3;
  console.log("Request count:", requests.length);

if (requests.length > limit) {
  const retryAfter = Math.ceil(
  (requests[0] + windowMs - now) / 1000
);
 res.set("Retry-After", retryAfter);
  return res.status(429).json({
    success: false,
    message: "Too many requests",
  });
}


  next();
};

module.exports = rateLimiter;