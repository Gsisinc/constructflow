import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const TECHNICIAN_PAGES = new Set([
  'TechnicianPortal', 'Calendar', 'TaskTracker', 'TimeCards', 'TechnicianTraining',
  'Directory', 'AIAgents', 'PayStub', 'RequestTimeOff', 'Settings', 'AlertSettings',
]);
const CLIENT_PAGES = new Set([
  'ClientPortal', 'Projects', 'Documents', 'ServiceDesk', 'Settings',
]);

/**
 * Redirects technicians/clients to their portal before admin content renders.
 * Use this so the admin layout never mounts for techs.
 */
export default function RoleGuard({ pageName, children }) {
  const { user } = useAuth();

  if (!user) return children;

  if (user.role === 'technician' && pageName && !TECHNICIAN_PAGES.has(pageName)) {
    return <Navigate to="/TechnicianPortal" replace />;
  }
  if (user.role === 'client' && pageName && !CLIENT_PAGES.has(pageName)) {
    return <Navigate to="/ClientPortal" replace />;
  }

  return children;
}
