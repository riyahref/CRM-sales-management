import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Customers & Activities API (/api/v1/customers)", () => {
  let rep1Token: string;
  let rep1Id: number;
  let rep2Token: string;
  let customerId: number;

  beforeAll(async () => {
    // Login Rep 1 & 2
    const rep1Res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "rep_1@acme.test", password: "password123" });
    rep1Token = rep1Res.body.token;
    rep1Id = rep1Res.body.user.id;

    const rep2Res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "rep_2@acme.test", password: "password123" });
    rep2Token = rep2Res.body.token;

    // Create Customer with an Opportunity owned by Rep 1
    const customer = await prisma.customer.create({
      data: { companyName: "Customer API Test Corp" }
    });
    customerId = customer.id;

    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 30);

    await prisma.opportunity.create({
      data: {
        customerId,
        ownerId: rep1Id,
        stage: "New",
        dealValue: 5000,
        expectedCloseDate: closeDate
      }
    });

    // Add initial contact
    await prisma.contactPerson.create({
      data: {
        customerId,
        name: "First Primary Contact",
        email: "first@customertest.com",
        isPrimary: true
      }
    });
  });

  afterAll(async () => {
    await prisma.activity.deleteMany({ where: { customerId } });
    await prisma.contactPerson.deleteMany({ where: { customerId } });
    await prisma.opportunity.deleteMany({ where: { customerId } });
    await prisma.customer.delete({ where: { id: customerId } });
    await prisma.$disconnect();
  });

  it("GET /customers/:id - Rep 1 can fetch Customer Detail", async () => {
    const res = await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe("Customer API Test Corp");
    expect(res.body.contacts.length).toBeGreaterThanOrEqual(1);
    expect(res.body.contacts[0].isPrimary).toBe(true);
  });

  it("GET /customers/:id - Rep 2 (unassociated) receives 404 NOT_FOUND", async () => {
    const res = await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set("Authorization", `Bearer ${rep2Token}`);

    expect(res.status).toBe(404);
  });

  it("POST /customers/:id/contacts - Adding a new primary contact un-marks the previous primary contact", async () => {
    const res = await request(app)
      .post(`/api/v1/customers/${customerId}/contacts`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({
        name: "Second Primary Contact",
        email: "second@customertest.com",
        isPrimary: true
      });

    expect(res.status).toBe(201);
    expect(res.body.isPrimary).toBe(true);

    // Verify in database that exactly one contact is primary
    const primaryContacts = await prisma.contactPerson.findMany({
      where: { customerId, isPrimary: true }
    });
    expect(primaryContacts.length).toBe(1);
    expect(primaryContacts[0].name).toBe("Second Primary Contact");
  });

  it("POST /customers/:id/activities - Successfully log an activity", async () => {
    const res = await request(app)
      .post(`/api/v1/customers/${customerId}/activities`)
      .set("Authorization", `Bearer ${rep1Token}`)
      .send({
        type: "call",
        notes: "Introductory discovery call with executive team",
        nextFollowUpDate: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe("call");
    expect(res.body.notes).toBe("Introductory discovery call with executive team");

    // Fetch detail and verify activity appears at top of timeline
    const detailRes = await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(detailRes.body.activities[0].notes).toBe(
      "Introductory discovery call with executive team"
    );
  });
});
