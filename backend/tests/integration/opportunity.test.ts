import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Opportunities API (/api/v1/opportunities)", () => {
  let rep1Token: string;
  let rep1Id: number;
  let rep2Id: number;
  let managerToken: string;

  let rep1Customer: number;
  let rep2Customer: number;
  let opp1Id: number;
  let opp2Id: number;

  beforeAll(async () => {
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

    // Login Manager
    const managerRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "manager_1@acme.test", password: "password123" });
    managerToken = managerRes.body.token;

    // Create test customers
    const c1 = await prisma.customer.create({
      data: { companyName: "Opp Test Corp Rep 1" }
    });
    rep1Customer = c1.id;

    const c2 = await prisma.customer.create({
      data: { companyName: "Opp Test Corp Rep 2" }
    });
    rep2Customer = c2.id;

    // Create test opportunities
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 30);

    const o1 = await prisma.opportunity.create({
      data: {
        customerId: rep1Customer,
        ownerId: rep1Id,
        stage: "New",
        dealValue: 10000,
        expectedCloseDate: closeDate
      }
    });
    opp1Id = o1.id;

    const o2 = await prisma.opportunity.create({
      data: {
        customerId: rep2Customer,
        ownerId: rep2Id,
        stage: "Contacted",
        dealValue: 20000,
        expectedCloseDate: closeDate
      }
    });
    opp2Id = o2.id;
  });

  afterAll(async () => {
    await prisma.opportunity.deleteMany({
      where: { id: { in: [opp1Id, opp2Id] } }
    });
    await prisma.customer.deleteMany({
      where: { id: { in: [rep1Customer, rep2Customer] } }
    });
    await prisma.$disconnect();
  });

  it("GET /opportunities - Rep sees only their own opportunities", async () => {
    const res = await request(app)
      .get("/api/v1/opportunities")
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((opp: { ownerId: number }) => opp.ownerId === rep1Id)).toBe(true);
  });

  it("GET /opportunities - Manager can toggle mine=false to see all opportunities", async () => {
    const res = await request(app)
      .get("/api/v1/opportunities?mine=false")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    const oppIds = res.body.data.map((o: { id: number }) => o.id);
    expect(oppIds).toContain(opp1Id);
    expect(oppIds).toContain(opp2Id);
  });

  it("GET /opportunities/:id - Ownership check returns 404 for unowned opportunity", async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${opp2Id}`)
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NOT_FOUND");
  });

  it("PATCH /opportunities/:id/stage - Ownership check returns 404 when rep attempts to PATCH another rep's opportunity", async () => {
    const res = await request(app)
      .patch(`/api/v1/opportunities/${opp2Id}/stage`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({ toStage: "Qualified" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NOT_FOUND");
  });

  it("PATCH /opportunities/:id/stage - Valid forward transition (New -> Contacted)", async () => {
    const res = await request(app)
      .patch(`/api/v1/opportunities/${opp1Id}/stage`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({ toStage: "Contacted" });

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe("Contacted");
  });

  it("PATCH /opportunities/:id/stage - Invalid skipped transition returns 409 INVALID_TRANSITION", async () => {
    // Current stage is Contacted, try skipping to Proposal
    const res = await request(app)
      .patch(`/api/v1/opportunities/${opp1Id}/stage`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({ toStage: "Proposal" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_TRANSITION");
  });

  it("PATCH /opportunities/:id/stage - Transition to Lost requires valid lostReason", async () => {
    // Missing lostReason
    const resNoReason = await request(app)
      .patch(`/api/v1/opportunities/${opp1Id}/stage`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({ toStage: "Lost" });

    expect(resNoReason.status).toBe(400);

    // Valid lostReason
    const resValid = await request(app)
      .patch(`/api/v1/opportunities/${opp1Id}/stage`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({ toStage: "Lost", lostReason: "Budget cut by client" });

    expect(resValid.status).toBe(200);
    expect(resValid.body.stage).toBe("Lost");
    expect(resValid.body.lostReason).toBe("Budget cut by client");
  });

  it("PATCH /opportunities/:id/stage - Terminal stage returns 409 INVALID_TRANSITION", async () => {
    // opp1 is now Lost (terminal), try transitioning to Won
    const res = await request(app)
      .patch(`/api/v1/opportunities/${opp1Id}/stage`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({ toStage: "Won" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_TRANSITION");
  });
});
