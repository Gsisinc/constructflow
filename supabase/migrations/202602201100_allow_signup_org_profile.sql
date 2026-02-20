-- Allow new users to create their own organization and profile on signup

create policy "profile insert by owner"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "org insert by owner"
  on public.organizations for insert
  with check (owner_id = auth.uid());
