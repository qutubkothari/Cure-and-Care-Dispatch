-- Add missing delivery fields expected by the client UI

ALTER TABLE "deliveries"
  ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "items" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "proofUrls" TEXT;

-- failurePhotoUrls already exists; store JSON string when multi-photo
