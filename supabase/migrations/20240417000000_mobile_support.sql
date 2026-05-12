-- 1. Add profile_id to erp_students to link them to auth users
ALTER TABLE IF EXISTS public.erp_students 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id);

-- 2. Create mobile_devices table for push notifications
CREATE TABLE IF NOT EXISTS public.mobile_devices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token text UNIQUE NOT NULL,
    platform text CHECK (platform IN ('ios', 'android')),
    last_active timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on mobile_devices
ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for mobile_devices
CREATE POLICY "Users can manage their own device tokens" 
ON public.mobile_devices 
FOR ALL USING (auth.uid() = user_id);

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_id ON public.mobile_devices(user_id);

-- 6. View to help mobile apps get their context quickly
CREATE OR REPLACE VIEW public.vw_mobile_user_context AS
SELECT 
    p.id as profile_id,
    p.full_name,
    p.role,
    p.school_id,
    s.name as school_name,
    s.logo_url,
    st.id as student_id,
    st.current_class_id,
    st.admission_number,
    staff.id as staff_id,
    staff.designation
FROM public.profiles p
JOIN public.schools s ON p.school_id = s.id
LEFT JOIN public.erp_students st ON st.profile_id = p.id
LEFT JOIN public.staff staff ON staff.profile_id = p.id;
