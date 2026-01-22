-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Apenas admins podem atualizar roles" ON public.user_roles;

-- Create new UPDATE policy for admin and sec
-- SEC can update roles but only to non-admin roles
CREATE POLICY "Admin and SEC can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'sec'::app_role)
)
WITH CHECK (
  -- Admin can set any role
  has_role(auth.uid(), 'admin'::app_role)
  OR 
  -- SEC can only set non-admin roles
  (has_role(auth.uid(), 'sec'::app_role) AND role != 'admin'::app_role)
);

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Apenas admins podem inserir roles" ON public.user_roles;

-- Create new INSERT policy for admin and sec
CREATE POLICY "Admin and SEC can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR 
  (has_role(auth.uid(), 'sec'::app_role) AND role != 'admin'::app_role)
);

-- Update SELECT policy to allow SEC to see all roles
DROP POLICY IF EXISTS "Utilizadores podem ver próprio role" ON public.user_roles;

CREATE POLICY "Users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'sec'::app_role)
);