import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bidId, projectId, bidTitle, bidStatus } = await req.json();

    if (!bidId || !projectId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Define task templates based on bid status
    const taskTemplates = {
      new: [
        {
          title: `Analyze Bid: ${bidTitle}`,
          description: 'Initial review and analysis of bid opportunity',
          category: 'bid_analysis',
          priority: 'high'
        },
        {
          title: `Research Project Requirements`,
          description: 'Review project specs, timeline, and requirements',
          category: 'documentation',
          priority: 'high'
        }
      ],
      analyzing: [
        {
          title: `Prepare Cost Estimate`,
          description: 'Create detailed cost estimate for the project',
          category: 'procurement',
          priority: 'high'
        },
        {
          title: `Review Compliance Requirements`,
          description: 'Check permits, insurance, and compliance needs',
          category: 'compliance',
          priority: 'medium'
        },
        {
          title: `Schedule Internal Review Meeting`,
          description: 'Schedule team meeting to discuss bid',
          category: 'communication',
          priority: 'medium'
        }
      ],
      estimating: [
        {
          title: `Finalize Bid Package`,
          description: 'Prepare all bid documents and package',
          category: 'documentation',
          priority: 'critical'
        },
        {
          title: `Obtain Subcontractor Quotes`,
          description: 'Gather quotes from required subcontractors',
          category: 'procurement',
          priority: 'high'
        },
        {
          title: `Final Bid Review`,
          description: 'QA check on all bid materials',
          category: 'quality',
          priority: 'critical'
        }
      ],
      submitted: [
        {
          title: `Follow Up on Bid`,
          description: 'Check status with client',
          category: 'follow_up',
          priority: 'medium'
        }
      ]
    };

    // Get appropriate tasks for status
    const tasks = taskTemplates[bidStatus] || taskTemplates.new;

    // Create tasks in parallel
    const createdTasks = await Promise.all(
      tasks.map(task => base44.entities.OperationalTask.create({
        project_id: projectId,
        bid_id: bidId,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: 'pending',
        source: 'auto_generated',
        auto_generated_from: `bid_${bidId}`
      }))
    );

    return Response.json({
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});