
CREATE TYPE public.app_role AS ENUM ('mahasiswa', 'tenant', 'admin');
CREATE TYPE public.tx_type AS ENUM ('earn', 'redeem');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'mahasiswa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.stamps (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  jumlah INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  tipe public.tx_type NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  tanggal TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone authenticated can read, only self can update non-role fields
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Tenants: anyone authenticated can read; tenant owners manage their own
CREATE POLICY "tenants_select_all" ON public.tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "tenants_insert_owner" ON public.tenants FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "tenants_update_owner" ON public.tenants FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- Stamps: only own
CREATE POLICY "stamps_select_own" ON public.stamps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "stamps_insert_own" ON public.stamps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stamps_update_own" ON public.stamps FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Transactions: mahasiswa sees own; tenant owners see transactions of their tenants
CREATE POLICY "tx_select_own" ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));
CREATE POLICY "tx_insert_own" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile + stamps on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_role public.app_role;
  user_nama TEXT;
  tenant_nama TEXT;
  new_tenant_id UUID;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'mahasiswa');
  user_nama := COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, nama, role) VALUES (NEW.id, user_nama, user_role);
  INSERT INTO public.stamps (user_id, jumlah) VALUES (NEW.id, 0);

  IF user_role = 'tenant' THEN
    tenant_nama := COALESCE(NEW.raw_user_meta_data->>'tenant_nama', user_nama);
    INSERT INTO public.tenants (nama, owner_id) VALUES (tenant_nama, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
