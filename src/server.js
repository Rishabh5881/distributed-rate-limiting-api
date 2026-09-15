const express = require("express");
const rateLimiter = require("./middleware/rateLimiter");
const redisClient = require("./config/redis");

const app = express();

const PORT = 5000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Rate Limiting API is running",
  });
});

app.get("/api/data", rateLimiter(3, 10 * 1000), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Request accepted",
    data: {
      user: "demo-user",
    },
  });
});

app.get("/api/fast-data", rateLimiter(5, 10 * 1000), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Fast data request accepted",
    data: {
      user: "demo-user",
    },
  });
});

if (require.main === module) {
  redisClient
    .connect()
    .then(() => {
      console.log("Redis connected");
    })
    .catch((error) => {
      console.error("Redis connection failed:", error);
    });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;