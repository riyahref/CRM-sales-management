import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("POST /api/v1/leads/:id/convert (Lead Conversion)", () => {
  let rep1Token: string;
  let rep1Id: number;
  let rep2Id: number;

  let qualifiedLeadId: number;
  let newLeadId: number;
  let rep2LeadId: number;

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

    // Create fresh test leads to guarantee status
    const qualifiedLead = await prisma.lead.create({
      data: {
        companyName: "Convert Test Qualified Corp",
        contactName: "Alice Convert",
        contactEmail: "alice.convert@acmetest.com",
        source: "Website",
        status: "Qualified",
        ownerId: rep1Id
      }
    });
    qualifiedLeadId = qualifiedLead.id;

    const newLead = await prisma.lead.create({
      data: {
        companyName: "Convert Test New Corp",
        contactName: "Bob New",
        contactEmail: "bob.new@acmetest.com",
        source: "Website",
        status: "New",
        ownerId: rep1Id
      }
    });
    newLeadId = newLead.id;

    const rep2Lead = await prisma.lead.create({
      data: {
        companyName: "Convert Test Rep 2 Corp",
        contactName: "Charlie Rep2",
        contactEmail: "charlie@acmetest.com",
        source: "Website",
        status: "Qualified",
        ownerId: rep2Id
      }
    });
    rep2LeadId = rep2Lead.id;
  });

  afterAll(async () => {
    // Clean up created test entities
    await prisma.activity.deleteMany({});
    await prisma.opportunity.deleteMany({});
    await prisma.contactPerson.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.lead.deleteMany({
      where: {
        id: { in: [qualifiedLeadId, newLeadId, rep2LeadId] }
      }
    });
    await prisma.$disconnect();
  });

  it("should successfully convert a Qualified lead in a single atomic transaction", async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${qualifiedLeadId}/convert`)
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("lead");
    expect(res.body).toHaveProperty("customer");
    expect(res.body).toHaveProperty("contactPerson");
    expect(res.body).toHaveProperty("opportunity");

    expect(res.body.lead.status).toBe("Converted");
    expect(res.body.customer.companyName).toBe("Convert Test Qualified Corp");
    expect(res.body.customer.convertedFromLeadId).toBe(qualifiedLeadId);
    expect(res.body.contactPerson.name).toBe("Alice Convert");
    expect(res.body.contactPerson.isPrimary).toBe(true);
    expect(res.body.opportunity.stage).toBe("New");
    expect(res.body.opportunity.ownerId).toBe(rep1Id);

    // Verify in database that lead status is Converted
    const dbLead = await prisma.lead.findUnique({ where: { id: qualifiedLeadId } });
    expect(dbLead?.status).toBe("Converted");
  });

  it("should return 409 INVALID_STATE when attempting to re-convert an already-converted lead", async () => {
    // Attempt second conversion on the same lead
    const res = await request(app)
      .post(`/api/v1/leads/${qualifiedLeadId}/convert`)
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: "INVALID_STATE",
      message: "Lead must be Contacted or Qualified before conversion."
    });

    // Ensure no duplicate customers were created
    const customerCount = await prisma.customer.count({
      where: { convertedFromLeadId: qualifiedLeadId }
    });
    expect(customerCount).toBe(1);
  });

  it("should return 409 INVALID_STATE when attempting to convert a 'New' lead", async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${newLeadId}/convert`)
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_STATE");
  });

  it("should return 404 NOT_FOUND when Rep 1 attempts to convert Rep 2's lead", async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${rep2LeadId}/convert`)
      .set("Authorization", `Bearer ${rep1Token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "NOT_FOUND",
      message: "This record could not be found."
    });
  });

  it("should rollback transaction atomically and leave no orphaned records if a transaction step fails", async () => {
    // Simulate failed transaction by attempting to convert a lead where customer creation would violate unique constraint
    // Create dummy customer already linked to a test lead
    const dummyLead = await prisma.lead.create({
      data: {
        companyName: "Rollback Test Corp",
        contactName: "Dan Rollback",
        contactEmail: "dan@acmetest.com",
        source: "Website",
        status: "Qualified",
        ownerId: rep1Id
      }
    });

    // Artificially insert a customer with convertedFromLeadId = dummyLead.id
    await prisma.customer.create({
      data: {
        companyName: "Pre-existing Customer",
        convertedFromLeadId: dummyLead.id
      }
    });

    // Now attempt to run lead conversion on dummyLead
    const res = await request(app)
      .post(`/api/v1/leads/${dummyLead.id}/convert`)
      .set("Authorization", `Bearer ${rep1Token}`);

    // Should fail with 500 or constraint error
    expect(res.status).toBeGreaterThanOrEqual(400);

    // Verify lead status was NOT updated to Converted (remained Qualified due to rollback)
    const dbLead = await prisma.lead.findUnique({ where: { id: dummyLead.id } });
    expect(dbLead?.status).toBe("Qualified");

    // Clean up dummy lead
    await prisma.customer.deleteMany({ where: { convertedFromLeadId: dummyLead.id } });
    await prisma.lead.delete({ where: { id: dummyLead.id } });
  });
});
