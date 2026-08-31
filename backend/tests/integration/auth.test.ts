import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Auth Endpoints (POST /api/v1/auth/login & POST /api/v1/auth/logout)", () => {
  beforeAll(async () => {
    // Deactivate rep_4@acme.test for inactive account testing
    await prisma.user.updateMany({
      where: { email: "rep_4@acme.test" },
      data: { isActive: false }
    });
  });

  afterAll(async () => {
    // Restore rep_4@acme.test to active state
    await prisma.user.updateMany({
      where: { email: "rep_4@acme.test" },
      data: { isActive: true }
    });
    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/login", () => {
    it("should authenticate active user with valid credentials and return token & user without passwordHash", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "rep_1@acme.test",
        password: "password123"
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toEqual({
        id: expect.any(Number),
        name: "Charlie Rep",
        email: "rep_1@acme.test",
        role: "rep",
        isActive: true,
        createdAt: expect.any(String)
      });

      // Strict check: password or passwordHash MUST NOT exist anywhere in the payload
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain("password");
    });

    it("should reject login with unknown email and return INVALID_CREDENTIALS", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "unknown_user_999@acme.test",
        password: "password123"
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password"
      });
    });

    it("should reject login with wrong password and return INVALID_CREDENTIALS", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "rep_1@acme.test",
        password: "wrongpassword123"
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password"
      });
    });

    it("should reject login for deactivated user and return ACCOUNT_INACTIVE", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "rep_4@acme.test",
        password: "password123"
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "ACCOUNT_INACTIVE",
        message: "This account is inactive. Contact your administrator."
      });
    });

    it("should return VALIDATION_ERROR for malformed email", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "not-an-email",
        password: "password123"
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("VALIDATION_ERROR");
      expect(response.body.fields).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should return 204 No Content when called with valid token", async () => {
      // First login to get a token
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "rep_1@acme.test",
        password: "password123"
      });

      const token = loginRes.body.token;

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(response.text).toBe("");
    });

    it("should return 401 UNAUTHORIZED when called without token", async () => {
      const response = await request(app).post("/api/v1/auth/logout");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "UNAUTHORIZED",
        message: "Your session expired — please log in again."
      });
    });

    it("should return 401 UNAUTHORIZED when called with invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", "Bearer invalid_token_12345");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "UNAUTHORIZED",
        message: "Your session expired — please log in again."
      });
    });
  });
});
