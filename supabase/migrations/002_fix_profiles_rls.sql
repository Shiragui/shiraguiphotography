-- Close profiles privilege-escalation: authenticated users must not INSERT their own profile.
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
