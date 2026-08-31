-- CreateEnum
CREATE TYPE "Role" AS ENUM ('rep', 'manager');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('New', 'Contacted', 'Qualified', 'Converted', 'Disqualified');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('Website', 'Referral', 'Cold Call', 'Trade Show', 'Other');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('call', 'meeting', 'note');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'New',
    "disqualify_reason" TEXT,
    "owner_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "industry" TEXT,
    "billing_address" TEXT,
    "converted_from_lead_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_persons" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "contact_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'New',
    "deal_value" DOUBLE PRECISION NOT NULL,
    "expected_close_date" TIMESTAMP(3) NOT NULL,
    "lost_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "opportunity_id" INTEGER,
    "owner_id" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "notes" TEXT NOT NULL,
    "next_follow_up_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "leads_owner_id_status_idx" ON "leads"("owner_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "customers_converted_from_lead_id_key" ON "customers"("converted_from_lead_id");

-- CreateIndex
CREATE INDEX "opportunities_owner_id_stage_idx" ON "opportunities"("owner_id", "stage");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_converted_from_lead_id_fkey" FOREIGN KEY ("converted_from_lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_persons" ADD CONSTRAINT "contact_persons_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
