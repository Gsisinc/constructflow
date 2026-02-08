import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useOrganization() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: organization, isLoading } = useQuery({
    queryKey: ['userOrganization', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const orgs = await base44.entities.Organization.filter({ owner_email: user.email });
      return orgs[0] || null;
    },
    enabled: !!user?.email,
  });

  return { organization, user, isLoading };
}