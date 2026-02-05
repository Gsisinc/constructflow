import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        // Use service role to create pending user (no auth required)
        await base44.asServiceRole.entities.PendingUser.create({
            full_name: body.full_name,
            email: body.email,
            phone: body.phone,
            requested_role: body.requested_role,
            company: body.company,
            message: body.message,
            status: 'pending'
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error creating pending user:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});