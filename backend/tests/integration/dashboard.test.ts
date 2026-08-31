import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Dashboard Summary API (/api/v1/dashboard/summary)", () => {
  let rep1Token: string;
  let managerToken: string;

  beforeAll(async () => {
    // Login Rep 1
    const rep1Res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "rep_1@acme.test", password: "password123" });
    rep1Token = rep1Res.body.token;

    // Login Manager
    const managerRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "manager_1@acme.test", password: "password123" });
    managerToken = managerRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /dashboard/summary - Rep receives role-scoped metrics with perRep omitted", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("openLeads");
    expect(res.body).toHaveProperty("leadsByStatus");
    expect(res.body).toHaveProperty("openOpportunities");
    expect(res.body).toHaveProperty("openPipelineValue");
    expect(res.body).toHaveProperty("followUpsDueToday");
    expect(res.body).toHaveProperty("wonThisMonth");
    expect(res.body).toHaveProperty("lostThisMonth");
    expect(res.body.perRep).toBeUndefined();
  });

  it("GET /dashboard/summary - Manager receives team-wide metrics and perRep array summing to total", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("perRep");
    expect(Array.isArray(res.body.perRep)).toBe(true);

    // Definition of Done Check: Manager's perRep array sums match manager top-level totals
    const sumOpenLeads = res.body.perRep.reduce(
      (acc: number, r: { openLeads: number }) => acc + r.openLeads,
      0
    );
    const sumPipelineValue = res.body.perRep.reduce(
      (acc: number, r: { openPipelineValue: number }) => acc + r.openPipelineValue,
      0
    );
    const sumWonMonth = res.body.perRep.reduce(
      (acc: number, r: { wonThisMonth: number }) => acc + r.wonThisMonth,
      0
    );

    expect(sumOpenLeads).toBe(res.body.openLeads);
    expect(sumPipelineValue).toBe(res.body.openPipelineValue);
    expect(sumWonMonth).toBe(res.body.wonThisMonth);
  });
});
