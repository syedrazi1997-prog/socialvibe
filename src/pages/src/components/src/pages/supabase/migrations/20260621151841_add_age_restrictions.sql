/*
# Add age rating restrictions to videos and birth date to profiles

1. New Columns
- videos.age_rating (text, default 'all') — content rating: 'all', '13+', or '18+'
- profiles.birth_date (date, nullable) — user's birth date for age verification

2. New Functions
- get_user_age() — returns integer age in years from auth user's birth_date, or NULL

3. Updated Security
- RLS on videos enforces age restrictions:
  - Unauthenticated: only 'all' rated videos
  - Authenticated no birth_date: only 'all' rated videos
  - Authenticated 13+: 'all' and '13+' videos
  - Authenticated 18+: 'all', '13+', and '18+' videos
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'age_rating') THEN
    ALTER TABLE videos ADD COLUMN age_rating text NOT NULL DEFAULT 'all';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_date') THEN
    ALTER TABLE profiles ADD COLUMN birth_date date;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION get_user_age()
RETURNS integer AS $$
DECLARE birth_date_val date;
BEGIN
  SELECT birth_date INTO birth_date_val FROM profiles WHERE id = auth.uid();
  IF birth_date_val IS NULL THEN RETURN NULL; END IF;
  RETURN extract(year from age(birth_date_val))::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "public_select_videos" ON videos;
DROP POLICY IF EXISTS "anon_select_videos" ON videos;
DROP POLICY IF EXISTS "age_appropriate_videos" ON videos;

CREATE POLICY "anon_select_videos" ON videos FOR SELECT
  TO anon USING (age_rating = 'all');

CREATE POLICY "age_appropriate_videos" ON videos FOR SELECT
  TO authenticated
  USING (
    age_rating = 'all'
    OR (age_rating = '13+' AND get_user_age() IS NOT NULL AND get_user_age() >= 13)
    OR (age_rating = '18+' AND get_user_age() IS NOT NULL AND get_user_age() >= 18)
  );

DROP POLICY IF EXISTS "own_update_video" ON videos;
CREATE POLICY "own_update_video" ON videos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_update_profile" ON profiles;
CREATE POLICY "own_update_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_videos_age_rating ON videos(age_rating);
