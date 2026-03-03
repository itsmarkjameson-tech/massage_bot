-- Step 1: Add 'su' value to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'su';
