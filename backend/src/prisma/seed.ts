import {
  PrismaClient,
  Role,
  LeadStatus,
  LeadSource,
  OpportunityStage,
  ActivityType
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Clear existing data in reverse dependency order for idempotency
  await prisma.activity.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.contactPerson.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // Hash passwords
  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Seed Users (2 Managers, 4 Reps)
  await prisma.user.create({
    data: {
      name: "Alice Manager",
      email: "manager_1@acme.test",
      passwordHash,
      role: Role.manager,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      name: "Bob Manager",
      email: "manager_2@acme.test",
      passwordHash,
      role: Role.manager,
      isActive: true
    }
  });

  const rep1 = await prisma.user.create({
    data: {
      name: "Charlie Rep",
      email: "rep_1@acme.test",
      passwordHash,
      role: Role.rep,
      isActive: true
    }
  });

  const rep2 = await prisma.user.create({
    data: {
      name: "Diana Rep",
      email: "rep_2@acme.test",
      passwordHash,
      role: Role.rep,
      isActive: true
    }
  });

  const rep3 = await prisma.user.create({
    data: {
      name: "Ethan Rep",
      email: "rep_3@acme.test",
      passwordHash,
      role: Role.rep,
      isActive: true
    }
  });

  const rep4 = await prisma.user.create({
    data: {
      name: "Fiona Rep",
      email: "rep_4@acme.test",
      passwordHash,
      role: Role.rep,
      isActive: true
    }
  });

  const reps = [rep1, rep2, rep3, rep4];
  console.log("Users seeded.");

  // 3. Seed Leads (30 leads across 8+ unique companies/contacts, all statuses & sources)
  const companies = [
    "TechNova Solutions",
    "Apex Global Trading",
    "Blue Sky Ventures",
    "Quantum Analytics",
    "Stellar Software",
    "Prime Logistics",
    "Summit Health",
    "Echo Media Group",
    "Omni Retail Corp",
    "Innova Design Ltd",
    "Vanguard Financials",
    "Matrix Systems",
    "Zentril Inc",
    "Epsilon Biotech",
    "Aura Therapeutics",
    "Nexus Automations",
    "Krypton Security",
    "Horizon Real Estate",
    "Pioneer Chemicals",
    "Titan Manufacturing",
    "Alpha Educational",
    "Delta Agriculture",
    "Gamma Hospitality",
    "Omega Energy",
    "Sigma Consulting",
    "Infinity Aerospace",
    "Bespoke Textiles",
    "GreenTerra Farms",
    "Velocity Automotive",
    "Crest Legal Advisors"
  ];

  const contacts = [
    "Alex Mercer",
    "Samantha Reed",
    "Marcus Vance",
    "Elena Rostova",
    "David Chen",
    "Sarah Jenkins",
    "James O'Connor",
    "Jessica Hayes",
    "Robert Sterling",
    "Linda Thorne",
    "William Wallace",
    "Elizabeth Bennett",
    "Joseph Cooper",
    "Barbara Wright",
    "Thomas Edison",
    "Susan Anthony",
    "Charles Xavier",
    "Margaret Atwood",
    "Christopher Nolan",
    "Dorothy Gale",
    "Daniel Craig",
    "Lisa Kudrow",
    "Matthew Perry",
    "Nancy Drew",
    "Anthony Hopkins",
    "Sandra Bullock",
    "Mark Twain",
    "Ashley Olsen",
    "Donald Glover",
    "Kimberly Adams"
  ];

  const leadStatuses = [
    LeadStatus.New,
    LeadStatus.Contacted,
    LeadStatus.Qualified,
    LeadStatus.Disqualified,
    LeadStatus.Converted
  ];

  const leadSources = [
    LeadSource.Website,
    LeadSource.Referral,
    LeadSource.Cold_Call,
    LeadSource.Trade_Show,
    LeadSource.Other
  ];

  const seededLeads = [];
  for (let i = 0; i < 30; i++) {
    // Distribution: 6 New, 6 Contacted, 5 Qualified, 5 Disqualified, 8 Converted
    let status: LeadStatus;
    if (i < 6) status = leadStatuses[0];
    else if (i < 12) status = leadStatuses[1];
    else if (i < 17) status = leadStatuses[2];
    else if (i < 22) status = leadStatuses[3];
    else status = leadStatuses[4];

    const source = leadSources[i % leadSources.length];
    const owner = reps[i % reps.length];

    const disqualifyReason =
      status === LeadStatus.Disqualified
        ? i % 2 === 0
          ? "Budget under minimum threshold ($2,000)"
          : "Selected alternative vendor"
        : null;

    const lead = await prisma.lead.create({
      data: {
        companyName: companies[i],
        contactName: contacts[i],
        contactEmail: `${contacts[i].toLowerCase().replace(/[^a-z]/g, ".")}@${companies[i]
          .toLowerCase()
          .replace(/[^a-z]/g, "")
          .slice(0, 10)}.test`,
        contactPhone: `+1-555-01${10 + i}`,
        source,
        status,
        disqualifyReason,
        ownerId: owner.id
      }
    });
    seededLeads.push(lead);
  }
  console.log(`${seededLeads.length} Leads seeded.`);

  // 4. Seed Customers & ContactPersons for all Converted leads (8 converted leads)
  const convertedLeads = seededLeads.filter((l) => l.status === LeadStatus.Converted);
  const seededCustomers = [];

  for (let i = 0; i < convertedLeads.length; i++) {
    const lead = convertedLeads[i];
    const customer = await prisma.customer.create({
      data: {
        companyName: lead.companyName,
        industry: i % 2 === 0 ? "Cloud Software & SaaS" : "Advanced Logistics",
        billingAddress: `${100 + i * 25} Business Park Way, Suite ${200 + i * 10}, San Jose, CA`,
        convertedFromLeadId: lead.id
      }
    });
    seededCustomers.push(customer);

    // Primary Contact
    await prisma.contactPerson.create({
      data: {
        customerId: customer.id,
        name: lead.contactName,
        title: i % 2 === 0 ? "VP of Procurement" : "Director of Operations",
        email: lead.contactEmail,
        phone: lead.contactPhone,
        isPrimary: true
      }
    });

    // Secondary Contact for every second customer
    if (i % 2 === 0) {
      await prisma.contactPerson.create({
        data: {
          customerId: customer.id,
          name: `Morgan ${lead.contactName.split(" ")[1] || "Smith"}`,
          title: "Technical Lead",
          email: `morgan.${lead.contactEmail.split("@")[0]}@${lead.contactEmail.split("@")[1]}`,
          phone: `+1-555-09${20 + i}`,
          isPrimary: false
        }
      });
    }
  }
  console.log(`${seededCustomers.length} Customers and contacts seeded.`);

  // 5. Seed Opportunities (Exactly 15 opportunities spread across ALL 6 stages)
  // Stages: New, Contacted, Qualified, Proposal, Negotiation, Won, Lost
  const stagesToSeed = [
    "New",
    "Contacted",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Won",
    "Lost",
    "Proposal",
    "Negotiation",
    "Won",
    "Lost",
    "New",
    "Qualified",
    "Proposal",
    "Negotiation"
  ] as OpportunityStage[];

  const dealValues = [
    12500, 24000, 45000, 68000, 95000, 110000, 32000, 54000, 82000, 120000, 18500, 29000, 61000,
    77000, 89000
  ];

  const today = new Date();
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const seededOpps = [];
  for (let i = 0; i < 15; i++) {
    const customer = seededCustomers[i % seededCustomers.length];
    const owner = reps[i % reps.length]; // Evenly distribute ownership among all 4 reps!
    const stage = stagesToSeed[i];
    const dealValue = dealValues[i];

    const expectedCloseDate = new Date();
    expectedCloseDate.setDate(today.getDate() + 10 + i * 5);

    const lostReason =
      stage === ("Lost" as OpportunityStage)
        ? i % 2 === 0
          ? "Budget frozen for Q3"
          : "Competitor offered 20% discount"
        : null;

    // Ensure Won/Lost timestamp falls in current month so wonThisMonth / lostThisMonth and conversionRate are non-zero!
    let updatedAt = new Date();
    if (stage === ("Won" as OpportunityStage) || stage === ("Lost" as OpportunityStage)) {
      const day = Math.min(Math.max(1, today.getDate() - (i % 4)), currentMonthEnd.getDate());
      updatedAt = new Date(today.getFullYear(), today.getMonth(), day, 11, 30, 0);
    }

    const opp = await prisma.opportunity.create({
      data: {
        customerId: customer.id,
        ownerId: owner.id,
        stage,
        dealValue,
        expectedCloseDate,
        lostReason,
        createdAt: new Date(today.getFullYear(), today.getMonth(), 1, 9, 0, 0),
        updatedAt
      }
    });
    seededOpps.push(opp);
  }
  console.log(`${seededOpps.length} Opportunities seeded.`);

  // 6. Seed Activities (Including at least 2 follow-ups due TODAY!)
  for (let i = 0; i < seededCustomers.length; i++) {
    const customer = seededCustomers[i];
    const owner = reps[i % reps.length];

    // Activity 1: Historical note/call
    await prisma.activity.create({
      data: {
        customerId: customer.id,
        ownerId: owner.id,
        type: "call" as ActivityType,
        notes: "Completed initial discovery call. Sent product capabilities deck.",
        createdAt: new Date(today.getTime() - 72 * 60 * 60 * 1000)
      }
    });

    // Activity 2: Detailed follow-up with specific dates
    let nextFollowUpDate: Date | null = null;
    let notes = "";
    let type: ActivityType = "note" as ActivityType;

    if (i === 0 || i === 1) {
      // Due TODAY so "Follow-ups due today" metric is >= 2!
      nextFollowUpDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0);
      notes =
        i === 0
          ? "Follow up today regarding final contract terms and security compliance review."
          : "Follow up today on proposal feedback and executive sponsor approval.";
      type = "meeting" as ActivityType;
    } else if (i === 2) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      nextFollowUpDate = tomorrow;
      notes = "Confirm technical evaluation environment setup.";
      type = "call" as ActivityType;
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      nextFollowUpDate = nextWeek;
      notes = "Quarterly business review touchpoint.";
      type = "note" as ActivityType;
    }

    await prisma.activity.create({
      data: {
        customerId: customer.id,
        ownerId: owner.id,
        type,
        notes,
        nextFollowUpDate,
        createdAt: new Date()
      }
    });
  }

  console.log("Activities seeded.");
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
