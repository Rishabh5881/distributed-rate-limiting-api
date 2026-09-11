const requests = [];

const rateLimiter = (req, res, next) => {
  const now = Date.now();
  const windowMs = 10 * 1000;

  requests.push(now);

  console.log("Requests:", requests);

  next();
};

module.exports = rateLimiter;