const request = require("supertest");
const app = require("../src/server");
const redisClient = require("../src/config/redis");

beforeAll(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
});

afterAll(async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("API Tests", () => {
  test("GET /health should return 200", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("GET /api/data should return 429 after 3 requests", async () => {
    const userId = `test-user-${Date.now()}`;

    const response1 = await request(app)
      .get("/api/data")
      .set("x-user-id", userId);

    const response2 = await request(app)
      .get("/api/data")
      .set("x-user-id", userId);

    const response3 = await request(app)
      .get("/api/data")
      .set("x-user-id", userId);

    const response4 = await request(app)
      .get("/api/data")
      .set("x-user-id", userId);

    expect(response1.statusCode).toBe(200);
    expect(response2.statusCode).toBe(200);
    expect(response3.statusCode).toBe(200);
    expect(response4.statusCode).toBe(429);

    expect(response4.body.success).toBe(false);
    expect(response4.body.message).toBe("Too many requests");
  });

  test("GET /api/data should return rate limit headers", async () => {
    const userId = `header-test-${Date.now()}`;

    const response = await request(app)
      .get("/api/data")
      .set("x-user-id", userId);

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-ratelimit-limit"]).toBe("3");
    expect(response.headers["x-ratelimit-remaining"]).toBe("2");
    expect(response.headers["x-ratelimit-reset"]).toBe("10");
  });
});