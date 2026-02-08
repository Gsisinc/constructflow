import { base44 } from '@/api/base44Client';

/**
 * Get all project IDs the current user has access to via ProjectTeam
 */
export async function getUserAccessibleProjects() {
  try {
    const user = await base44.auth.me();
    if (!user) return [];

    const teamRecords = await base44.entities.ProjectTeam.filter({
      user_email: user.email
    });

    return [...new Set(teamRecords.map(t => t.project_id))];
  } catch (e) {
    console.error('Failed to fetch user accessible projects:', e);
    return [];
  }
}

/**
 * Check if user has access to a specific project
 */
export async function hasProjectAccess(projectId) {
  const projects = await getUserAccessibleProjects();
  return projects.includes(projectId);
}

/**
 * Get user's role for a specific project
 */
export async function getUserProjectRole(projectId) {
  try {
    const user = await base44.auth.me();
    if (!user) return null;

    const teamRecord = await base44.entities.ProjectTeam.filter({
      project_id: projectId,
      user_email: user.email
    });

    return teamRecord.length > 0 ? teamRecord[0].role_name : null;
  } catch (e) {
    console.error('Failed to fetch user role:', e);
    return null;
  }
}