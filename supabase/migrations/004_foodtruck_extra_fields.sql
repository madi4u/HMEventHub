-- Add extra fields to foodtrucks table
ALTER TABLE foodtrucks
  ADD COLUMN IF NOT EXISTS license_plate TEXT,
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS is_truck BOOLEAN DEFAULT TRUE;
