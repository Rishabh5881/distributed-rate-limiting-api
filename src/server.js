const express = require("express");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

const PORT = 5000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Rate Limiting API is running",
  });
});

app.get("/api/data", rateLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Request accepted",
    data: {
      user: "demo-user",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});