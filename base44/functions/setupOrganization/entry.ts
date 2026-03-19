import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, org_name, invite_code } = body;

    if (action === 'create') {
      // Create new organization
      const org = await base44.entities.Organization.create({
        name: org_name,
        owner_email: user.email
      });

      // Add user to organization
      await base44.entities.ProjectTeam.create({
        project_id: org.id,
        user_email: user.email,
        user_name: user.full_name,
        role_name: 'Organization Owner',
        status: 'active'
      });

      // Update user with organization
      await base44.auth.updateMe({
        organization_id: org.id
      });

      return Response.json({ success: true, org_id: org.id });
    }

    if (action === 'join') {
      // Validate and process invite code
      const org = await base44.entities.Organization.filter({
        invite_code: invite_code
      });

      if (!org || org.length === 0) {
        return Response.json({ error: 'Invalid invite code' }, { status: 400 });
      }

      const targetOrg = org[0];

      // Add user to organization
      await base44.entities.ProjectTeam.create({
        project_id: targetOrg.id,
        user_email: user.email,
        user_name: user.full_name,
        role_name: 'Team Member',
        status: 'active'
      });

      // Update user with organization
      await base44.auth.updateMe({
        organization_id: targetOrg.id
      });

      return Response.json({ success: true, org_id: targetOrg.id });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});