ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "reviewerId" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewerName" TEXT;

CREATE TABLE IF NOT EXISTS "SubTask" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "completedById" TEXT,
  "completedByName" TEXT,
  "createdById" TEXT,
  "createdByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MissingDocument" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "documentName" TEXT NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'requested',
  "requestedById" TEXT,
  "requestedByName" TEXT,
  "receivedDocumentId" TEXT,
  "receivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MissingDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RequestActivity" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "actorName" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequestActivity_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SubTask_serviceRequestId_fkey'
  ) THEN
    ALTER TABLE "SubTask"
      ADD CONSTRAINT "SubTask_serviceRequestId_fkey"
      FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MissingDocument_serviceRequestId_fkey'
  ) THEN
    ALTER TABLE "MissingDocument"
      ADD CONSTRAINT "MissingDocument_serviceRequestId_fkey"
      FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RequestActivity_serviceRequestId_fkey'
  ) THEN
    ALTER TABLE "RequestActivity"
      ADD CONSTRAINT "RequestActivity_serviceRequestId_fkey"
      FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SubTask_serviceRequestId_idx" ON "SubTask"("serviceRequestId");
CREATE INDEX IF NOT EXISTS "MissingDocument_serviceRequestId_idx" ON "MissingDocument"("serviceRequestId");
CREATE INDEX IF NOT EXISTS "MissingDocument_status_idx" ON "MissingDocument"("status");
CREATE INDEX IF NOT EXISTS "RequestActivity_serviceRequestId_idx" ON "RequestActivity"("serviceRequestId");
CREATE INDEX IF NOT EXISTS "RequestActivity_createdAt_idx" ON "RequestActivity"("createdAt");
