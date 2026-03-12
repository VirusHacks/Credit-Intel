-- Add SWOT analysis JSON column to cam_outputs table
ALTER TABLE "cam_outputs" ADD COLUMN IF NOT EXISTS "swot_json" jsonb;
