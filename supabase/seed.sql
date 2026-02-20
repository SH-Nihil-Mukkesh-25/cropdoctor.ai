-- ========================================================
-- CropGuard Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor.
--
-- NOTE: Supabase Auth users cannot be created via plain SQL
-- inserts. This script creates demo scan_history entries
-- that will be linked to real users once they sign up.
--
-- To create the default test users, use the setup_db.sh
-- script which calls the Supabase Auth API.
-- ========================================================

-- This file is a placeholder. The actual seeding (user creation
-- + sample scan history) is done by the setup_db.sh script below,
-- which uses the Supabase Auth REST API to create users properly.

-- After users are created by setup_db.sh, their profiles are
-- automatically populated via the on_auth_user_created trigger.
