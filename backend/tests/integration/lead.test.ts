import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Leads API Endpoints", () => {
  let managerToken: string;
  let rep1Token: string;
  let rep1Id: number;
  let rep2Id: number;

  let rep1LeadId: number;
  let rep2LeadId: number;

  beforeAll(async () => {
    // Login Manager
    const mgrRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "manager_1@acme.test", password: "password123" });
    managerToken = mgrRes.body.token;

    // Login Rep 1
    const rep1Res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "rep_1@acme.test", password: "password123" });
    rep1Token = rep1Res.body.token;
    rep1Id = rep1Res.body.user.id;

    // Login Rep 2
    const rep2Res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "rep_2@acme.test", password: "password123" });
    rep2Id = rep2Res.body.user.id;

    // Find a lead owned by Rep 1 and a lead owned by Rep 2
    const lead1 = await prisma.lead.findFirst({ where: { ownerId: rep1Id } });
    const lead2 = await prisma.lead.findFirst({ where: { ownerId: rep2Id } });

    if (!lead1 || !lead2) {
      throw new Error("Seeded leads missing for integration test setup");
    }

    rep1LeadId = lead1.id;
    rep2LeadId = lead2.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/v1/leads", () => {
    it("should allow Rep 1 to fetch only their owned leads", async () => {
      const res = await request(app)
        .get("/api/v1/leads")
        .set("Authorization", `Bearer ${rep1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((lead: { ownerId: number }) => {
        expect(lead.ownerId).toBe(rep1Id);
      });
    });

    it("should allow Manager to fetch leads across all reps", async () => {
      const res = await request(app)
        .get("/api/v1/leads")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      const ownerIds = new Set(res.body.data.map((l: { ownerId: number }) => l.ownerId));
      expect(ownerIds.size).toBeGreaterThan(1);
    });

    it("should filter leads by status and source", async () => {
      const res = await request(app)
        .get("/api/v1/leads?status=New&source=Website")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((l: { status: string; source: string }) => {
        expect(l.status).toBe("New");
        expect(l.source).toBe("Website");
      });
    });
  });

  describe("GET /api/v1/leads/:id", () => {
    it("should allow Rep 1 to fetch their own lead", async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${rep1LeadId}`)
        .set("Authorization", `Bearer ${rep1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(rep1LeadId);
    });

    it("should return 404 NOT_FOUND when Rep 1 attempts to fetch Rep 2's lead (privacy protection)", async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${rep2LeadId}`)
        .set("Authorization", `Bearer ${rep1Token}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: "NOT_FOUND",
        message: "This record could not be found."
      });
    });

    it("should allow Manager to fetch any rep's lead", async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${rep2LeadId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(rep2LeadId);
    });
  });

  describe("POST /api/v1/leads", () => {
    it("should allow Manager to create a new lead", async () => {
      const newLeadData = {
        companyName: "Acme Testing Inc",
        contactName: "John Test",
        contactEmail: "john.test@acmetest.com",
        contactPhone: "555-0199",
        source: "Website",
        ownerId: rep1Id
      };

      const res = await request(app)
        .post("/api/v1/leads")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(newLeadData);

      expect(res.status).toBe(201);
      expect(res.body.companyName).toBe("Acme Testing Inc");
      expect(res.body.status).toBe("New");
      expect(res.body.ownerId).toBe(rep1Id);
    });

    it("should reject lead creation by a Rep with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .post("/api/v1/leads")
        .set("Authorization", `Bearer ${rep1Token}`)
        .send({
          companyName: "Rep Create Attempt",
          contactName: "Rep Test",
          contactEmail: "reptest@acme.test",
          source: "Website",
          ownerId: rep1Id
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("FORBIDDEN");
    });

    it("should reject lead creation with invalid email with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/v1/leads")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          companyName: "Invalid Email Inc",
          contactName: "John Test",
          contactEmail: "not-an-email",
          source: "Website",
          ownerId: rep1Id
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("VALIDATION_ERROR");
      expect(res.body.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "contactEmail",
            message: "Enter a valid email address"
          })
        ])
      );
    });
  });

  describe("PATCH /api/v1/leads/:id", () => {
    it("should allow Rep 1 to edit status to Disqualified with a valid disqualifyReason", async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${rep1LeadId}`)
        .set("Authorization", `Bearer ${rep1Token}`)
        .send({
          status: "Disqualified",
          disqualifyReason: "Budget is too low for enterprise tier"
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Disqualified");
      expect(res.body.disqualifyReason).toBe("Budget is too low for enterprise tier");
    });

    it("should reject disqualifying without reason or reason < 5 chars with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${rep1LeadId}`)
        .set("Authorization", `Bearer ${rep1Token}`)
        .send({
          status: "Disqualified",
          disqualifyReason: "tiny"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("VALIDATION_ERROR");
    });

    it("should reject manual update to Converted with 409 INVALID_STATE", async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${rep1LeadId}`)
        .set("Authorization", `Bearer ${rep1Token}`)
        .send({
          status: "Converted"
        });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        error: "INVALID_STATE",
        message: "Status 'Converted' can only be set via the Convert action."
      });
    });

    it("should return 404 NOT_FOUND when Rep 1 attempts to edit Rep 2's lead", async () => {
      const res = await request(app)
        .patch(`/api/v1/leads/${rep2LeadId}`)
        .set("Authorization", `Bearer ${rep1Token}`)
        .send({
          companyName: "Unauthorized Edit"
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("NOT_FOUND");
    });
  });
});
