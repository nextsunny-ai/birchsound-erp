-- Add title column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';

-- Update trigger to save title
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, department, role, title)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '이름없음'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    'member',
    COALESCE(NEW.raw_user_meta_data->>'title', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
