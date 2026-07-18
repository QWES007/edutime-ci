-- Edutime CI — Supabase PostgreSQL Schema
-- Multi-tenant SaaS for Ivorian secondary school timetables
-- Run via: supabase db push OR paste in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('censeur', 'admin', 'directeur_etudes');
CREATE TYPE pricing_plan AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
);
CREATE TYPE room_type AS ENUM ('standard', 'lab', 'sports');
CREATE TYPE class_level AS ENUM (
  '6eme', '5eme', '4eme', '3eme',
  '2nde_a', '2nde_c',
  '1ere_a', '1ere_c', '1ere_d',
  'tle_a', 'tle_c', 'tle_d'
);

-- =============================================================================
-- SCHOOLS (Tenant root)
-- =============================================================================

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT DEFAULT 'Abidjan',
  region TEXT DEFAULT 'Abidjan',
  plan pricing_plan NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_teachers INTEGER NOT NULL DEFAULT 30,
  max_classes INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PROFILES (extends auth.users)
-- =============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'censeur',
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TEACHERS
-- =============================================================================

CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  max_hours_per_week INTEGER NOT NULL DEFAULT 18,
  unavailabilities JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teachers_school ON teachers(school_id);

-- =============================================================================
-- ROOMS
-- =============================================================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 40,
  type room_type NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_school ON rooms(school_id);

-- =============================================================================
-- CLASS GROUPS
-- =============================================================================

CREATE TABLE classgroups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  level class_level NOT NULL,
  name TEXT NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE INDEX idx_classgroups_school ON classgroups(school_id);

-- =============================================================================
-- SUBJECTS (per class, with MENA weekly hours)
-- =============================================================================

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classgroups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weekly_hours_required INTEGER NOT NULL CHECK (weekly_hours_required > 0),
  requires_double_block BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_school ON subjects(school_id);
CREATE INDEX idx_subjects_class ON subjects(class_id);

-- =============================================================================
-- TIMETABLE ENTRIES
-- =============================================================================

CREATE TABLE timetable_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classgroups(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_timetable_school ON timetable_entries(school_id);
CREATE INDEX idx_timetable_class ON timetable_entries(class_id);
CREATE INDEX idx_timetable_teacher ON timetable_entries(teacher_id);
CREATE INDEX idx_timetable_room ON timetable_entries(room_id);
CREATE INDEX idx_timetable_day_time ON timetable_entries(day_of_week, start_time);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER classgroups_updated_at BEFORE UPDATE ON classgroups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER timetable_entries_updated_at BEFORE UPDATE ON timetable_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) — Multi-tenant isolation
-- =============================================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's school_id
CREATE OR REPLACE FUNCTION auth.user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Schools: users can only see their own school
CREATE POLICY "Users can view own school"
  ON schools FOR SELECT
  USING (id = auth.user_school_id());

CREATE POLICY "Users can update own school"
  ON schools FOR UPDATE
  USING (id = auth.user_school_id());

-- Profiles: users can view/update own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Teachers: school-scoped CRUD
CREATE POLICY "School teachers select"
  ON teachers FOR SELECT USING (school_id = auth.user_school_id());
CREATE POLICY "School teachers insert"
  ON teachers FOR INSERT WITH CHECK (school_id = auth.user_school_id());
CREATE POLICY "School teachers update"
  ON teachers FOR UPDATE USING (school_id = auth.user_school_id());
CREATE POLICY "School teachers delete"
  ON teachers FOR DELETE USING (school_id = auth.user_school_id());

-- Rooms: school-scoped CRUD
CREATE POLICY "School rooms select"
  ON rooms FOR SELECT USING (school_id = auth.user_school_id());
CREATE POLICY "School rooms insert"
  ON rooms FOR INSERT WITH CHECK (school_id = auth.user_school_id());
CREATE POLICY "School rooms update"
  ON rooms FOR UPDATE USING (school_id = auth.user_school_id());
CREATE POLICY "School rooms delete"
  ON rooms FOR DELETE USING (school_id = auth.user_school_id());

-- Classgroups: school-scoped CRUD
CREATE POLICY "School classgroups select"
  ON classgroups FOR SELECT USING (school_id = auth.user_school_id());
CREATE POLICY "School classgroups insert"
  ON classgroups FOR INSERT WITH CHECK (school_id = auth.user_school_id());
CREATE POLICY "School classgroups update"
  ON classgroups FOR UPDATE USING (school_id = auth.user_school_id());
CREATE POLICY "School classgroups delete"
  ON classgroups FOR DELETE USING (school_id = auth.user_school_id());

-- Subjects: school-scoped CRUD
CREATE POLICY "School subjects select"
  ON subjects FOR SELECT USING (school_id = auth.user_school_id());
CREATE POLICY "School subjects insert"
  ON subjects FOR INSERT WITH CHECK (school_id = auth.user_school_id());
CREATE POLICY "School subjects update"
  ON subjects FOR UPDATE USING (school_id = auth.user_school_id());
CREATE POLICY "School subjects delete"
  ON subjects FOR DELETE USING (school_id = auth.user_school_id());

-- Timetable entries: school-scoped CRUD
CREATE POLICY "School timetable select"
  ON timetable_entries FOR SELECT USING (school_id = auth.user_school_id());
CREATE POLICY "School timetable insert"
  ON timetable_entries FOR INSERT WITH CHECK (school_id = auth.user_school_id());
CREATE POLICY "School timetable update"
  ON timetable_entries FOR UPDATE USING (school_id = auth.user_school_id());
CREATE POLICY "School timetable delete"
  ON timetable_entries FOR DELETE USING (school_id = auth.user_school_id());

-- =============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_school_id UUID;
  school_name_val TEXT;
BEGIN
  school_name_val := COALESCE(NEW.raw_user_meta_data->>'school_name', 'Mon Établissement');

  INSERT INTO schools (name, plan)
  VALUES (school_name_val, 'starter')
  RETURNING id INTO new_school_id;

  INSERT INTO profiles (id, school_id, school_name, full_name, role, email)
  VALUES (
    NEW.id,
    new_school_id,
    school_name_val,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Censeur'),
    'censeur',
    NEW.email
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
