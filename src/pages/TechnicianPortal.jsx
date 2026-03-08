import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  HardHat,
  Image as ImageIcon,
  Layers3,
  MapPin,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Siren,
  AlertTriangle,
  UserCheck,
  Wifi,
  Camera,
  ArrowUpRight,
  Building2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ClockIn from "@/components/dashboard/ClockIn";

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#CBAE63]/80">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <Card className={`border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}>
      {children}
    </Card>
  );
}

const technicianTools = [
  { label: "Site Contacts", icon: UserCheck, page: "Directory" },
  { label: "Photos", icon: ImageIcon, page: "Photos" },
  { label: "Documents", icon: FileText, page: "Documents" },
  { label: "Materials", icon: Package, page: "Materials" },
  { label: "Safety", icon: HardHat, page: "Safety" },
  { label: "Incidents", icon: Siren, page: "Issues" },
  { label: "Support", icon: MessageSquare, page: "ServiceDesk" },
  { label: "Settings", icon: Settings, page: "Settings" },
];

const technicianModules = [
  { title: "My Work Orders", desc: "Assigned tasks, priorities, SLAs.", icon: ClipboardList, page: "TaskTracker" },
  { title: "Daily Schedule", desc: "Day view, week view, calendar sync.", icon: CalendarDays, page: "Calendar" },
  { title: "Project Access", desc: "Project details, site contacts, scope.", icon: Layers3, page: "Projects" },
  { title: "Time Tracking", desc: "Clock in/out, timesheets, overtime.", icon: Clock3, page: "TimeCards" },
  { title: "Plans & Documents", desc: "Drawings, RFIs, submittals, manuals.", icon: FileText, page: "Documents" },
  { title: "Photos & Media", desc: "Before/after, punch images, uploads.", icon: Camera, page: "Photos" },
  { title: "Materials & Tools", desc: "Parts requests, inventory, shortages.", icon: Package, page: "Materials" },
  { title: "Field Forms", desc: "Service reports, inspections, sign-offs.", icon: CheckCircle2, page: "TaskTracker" },
  { title: "Safety & Compliance", desc: "JHAs, incident reports, PPE checks.", icon: ShieldCheck, page: "Safety" },
  { title: "Support & Escalation", desc: "Remote support, issue escalation.", icon: MessageSquare, page: "ServiceDesk" },
];

export default function TechnicianPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: worker } = useQuery({
    queryKey: ["techWorker", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const list = await base44.entities.Worker.filter({ email: user.email }).catch(() => []);
      return Array.isArray(list) && list.length ? list[0] : null;
    },
    enabled: !!user?.email,
  });

  const assignedProjectIds = [worker?.current_project_id, worker?.project_id].filter(Boolean);
  const { data: assignedProjects = [] } = useQuery({
    queryKey: ["techProjects", assignedProjectIds],
    queryFn: async () => {
      if (assignedProjectIds.length === 0) return [];
      const out = [];
      for (const id of assignedProjectIds) {
        try {
          const p = await base44.entities.Project.filter({ id }).then((r) => r?.[0]);
          if (p) out.push(p);
        } catch (_) {}
      }
      return out;
    },
    enabled: assignedProjectIds.length > 0,
  });

  const { data: myTasksRaw = [] } = useQuery({
    queryKey: ["techTasks", worker?.id, user?.organization_id, assignedProjectIds],
    queryFn: async () => {
      try {
        if (user?.organization_id) {
          const list = await base44.entities.OperationalTask.filter({ organization_id: user.organization_id }).catch(() => []);
          const arr = Array.isArray(list) ? list : [];
          if (arr.length > 0) {
            if (worker?.id) return arr.filter((t) => t.assigned_to === worker.id || t.assignee_id === worker.id || !t.assigned_to);
            return arr;
          }
        }
      } catch (_) {}
      const all = [];
      for (const pid of assignedProjectIds) {
        try {
          const tasks = await base44.entities.Task.filter({ project_id: pid }).catch(() => []);
          const list = Array.isArray(tasks) ? tasks : [];
          all.push(...list.filter((t) => !worker?.id || t.assigned_to === worker.id || t.assignee_id === worker.id));
        } catch (_) {}
      }
      return all;
    },
    enabled: !!user?.organization_id || assignedProjectIds.length > 0,
  });

  const myTasks = Array.isArray(myTasksRaw) ? myTasksRaw : [];

  const { data: fieldHours = [] } = useQuery({
    queryKey: ["fieldHours", user?.email],
    queryFn: () => (user?.email ? base44.entities.FieldHoursLog.filter({ technician_email: user.email }).catch(() => []) : []),
    enabled: !!user?.email,
  });

  const { data: openIssues = [] } = useQuery({
    queryKey: ["techIssues", assignedProjectIds],
    queryFn: async () => {
      const all = [];
      for (const pid of assignedProjectIds) {
        try {
          const list = await base44.entities.Issue.filter({ project_id: pid }).catch(() => []);
          all.push(...(Array.isArray(list) ? list.filter((i) => i.status !== "closed" && i.status !== "resolved") : []));
        } catch (_) {}
      }
      return all;
    },
    enabled: assignedProjectIds.length > 0,
  });

  const totalHours = Array.isArray(fieldHours) ? fieldHours.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0) : 0;
  const todayTasks = Array.isArray(myTasks) ? myTasks.filter((t) => {
    const d = t.due_date || t.due || t.scheduled_date;
    if (!d) return true;
    const today = new Date().toISOString().slice(0, 10);
    return String(d).slice(0, 10) === today;
  }) : [];
  const inProgressTasks = Array.isArray(myTasks) ? myTasks.filter((t) => (t.status || "").toLowerCase() === "in_progress" || (t.status || "").toLowerCase() === "in progress") : [];

  const quickStats = [
    { label: "Assigned Today", value: String(todayTasks.length), icon: ClipboardList },
    { label: "Active Sites", value: String(assignedProjects.length || 0), icon: Building2 },
    { label: "Hours Logged", value: String(totalHours.toFixed(1)), icon: Clock3 },
    { label: "Open Issues", value: String(openIssues.length), icon: AlertTriangle },
  ];

  const highPriorityTasks = (Array.isArray(myTasks) ? myTasks.slice(0, 5) : []).map((t) => ({
    id: t.id,
    title: t.title || t.name || "Task",
    type: t.type || t.priority || "Task",
    site: assignedProjects.find((p) => p.id === t.project_id)?.name || "—",
    eta: t.due_date ? new Date(t.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    status: t.status || "Pending",
    progress: t.percent_complete ?? (t.status === "completed" ? 100 : t.status === "in_progress" ? 50 : 0),
  }));

  const goTo = (page) => {
    if (page === "TechnicianPortal") return;
    navigate(createPageUrl(page));
  };

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06152B] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(203,174,99,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.18),transparent_24%),linear-gradient(180deg,#071224_0%,#081A34_50%,#06152B_100%)]" />
      <div className="relative mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <main className="space-y-6">
              <GlassCard className="rounded-[30px]">
                <CardContent className="p-6 lg:p-7">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <Badge className="border-0 bg-[#CBAE63]/15 px-3 py-1 text-[#E8D39B] hover:bg-[#CBAE63]/15">Premium Technician Workspace</Badge>
                      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                        Field control for technicians.
                      </h1>
                      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 lg:text-lg">
                        Your dashboard: tasks, schedule, time tracking, documents, and support — all in one place.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="h-12 rounded-2xl bg-gradient-to-r from-[#D7B86A] to-[#A57B2D] px-5 text-[#08111F] hover:opacity-95"
                        onClick={() => goTo("TaskTracker")}
                      >
                        Open My Tasks
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-2xl border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
                        onClick={() => goTo("TimeCards")}
                      >
                        Time Cards & Check-In
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>

              <ClockIn />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {quickStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <GlassCard key={stat.label} className="rounded-[24px]">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-slate-400">{stat.label}</p>
                            <p className="mt-2 text-4xl font-semibold text-white">{stat.value}</p>
                          </div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#CBAE63]/25 bg-[#CBAE63]/10 text-[#E1C67D]">
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>
                      </CardContent>
                    </GlassCard>
                  );
                })}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <GlassCard className="rounded-[28px]">
                  <CardHeader className="pb-2">
                    <SectionTitle
                      eyebrow="Work Queue"
                      title="High-priority assignments"
                      right={
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => goTo("TaskTracker")}
                        >
                          View all
                        </Button>
                      }
                    />
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    {highPriorityTasks.length === 0 ? (
                      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-400">No tasks assigned yet. Open My Tasks or ask your supervisor.</p>
                    ) : (
                      highPriorityTasks.map((task, i) => (
                        <motion.div
                          key={task.id || i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-[24px] border border-white/10 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-5"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-0 bg-[#CBAE63]/15 text-[#E8D39B] hover:bg-[#CBAE63]/15">{task.type}</Badge>
                                <Badge className="border-0 bg-[#295FC6]/20 text-blue-200 hover:bg-[#295FC6]/20">{task.status}</Badge>
                              </div>
                              <h3 className="mt-3 text-xl font-semibold text-white">{task.title}</h3>
                              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {task.site}</span>
                                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> {task.eta}</span>
                              </div>
                            </div>
                            <div className="min-w-[220px] xl:max-w-[260px] xl:text-right">
                              <div className="mb-2 flex items-center justify-between text-sm text-slate-400 xl:justify-end xl:gap-3">
                                <span>Progress</span>
                                <span className="font-medium text-white">{task.progress}%</span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-gradient-to-r from-[#D7B86A] to-[#2D63C7]" style={{ width: `${task.progress}%` }} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </GlassCard>

                <div className="space-y-6">
                  <GlassCard className="rounded-[28px]">
                    <CardHeader>
                      <SectionTitle eyebrow="Quick Access" title="Technician tools" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {technicianTools.map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <button
                              key={tool.label}
                              type="button"
                              onClick={() => goTo(tool.page)}
                              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08]"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CBAE63]/12 text-[#E1C67D]">
                                <Icon className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium text-slate-100">{tool.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </GlassCard>

                  <GlassCard className="rounded-[28px]">
                    <CardHeader>
                      <SectionTitle eyebrow="Snapshot" title="Your context" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1C417D]/25 text-[#E1C67D] ring-1 ring-[#CBAE63]/20">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-400">Active projects</p>
                          <p className="mt-1 text-xl font-semibold text-white">{assignedProjects.length}</p>
                          <p className="mt-1 text-sm text-slate-400">Assigned to you</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1C417D]/25 text-[#E1C67D] ring-1 ring-[#CBAE63]/20">
                          <Clock3 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-400">Hours logged</p>
                          <p className="mt-1 text-xl font-semibold text-white">{totalHours.toFixed(1)}</p>
                          <p className="mt-1 text-sm text-slate-400">Total field hours</p>
                        </div>
                      </div>
                    </CardContent>
                  </GlassCard>
                </div>
              </div>

              <GlassCard className="rounded-[30px]">
                <CardHeader>
                  <SectionTitle eyebrow="Modules" title="Portal features" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {technicianModules.map((module) => {
                      const Icon = module.icon;
                      return (
                        <button
                          key={module.title}
                          type="button"
                          onClick={() => goTo(module.page)}
                          className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D7B86A]/20 to-[#214C94]/25 text-[#E3C978] ring-1 ring-white/10">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="mt-4 text-xl font-semibold text-white">{module.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{module.desc}</p>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#CBAE63]">
                            Open <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </GlassCard>
            </main>
        </motion.div>
      </div>
    </div>
  );
}
