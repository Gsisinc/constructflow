import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

/**
 * Add / edit a resource allocation.
 * props: open, onOpenChange, organizationId, onSaved, projects, workers,
 *        projectId (prefill, optional), phasesForProject (array)
 */
export default function ResourceAssignmentDialog({
  open, onOpenChange, organizationId, onSaved, projects = [], workers = [], projectId: prefillProject, phasesForProject = [],
}) {
  const { toast } = useToast();
  const [resourceType, setResourceType] = useState("tech");
  const [resourceId, setResourceId] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [projectId, setProjectId] = useState(prefillProject || "");
  const [phaseId, setPhaseId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setProjectId(prefillProject || "");
      setPhaseId("");
      setResourceId("");
      setEquipmentName("");
      setRole("");
      setNotes("");
    }
  }, [open, prefillProject]);

  const reset = () => {
    setResourceType("tech"); setResourceId(""); setEquipmentName("");
    setPhaseId(""); setStartDate(""); setEndDate(""); setRole(""); setNotes("");
  };

  const handleSave = async () => {
    if (!startDate || !endDate) {
      toast({ title: "Dates required", description: "Pick a start and end date.", variant: "destructive" });
      return;
    }
    if (endDate < startDate) {
      toast({ title: "Invalid range", description: "End date is before start date.", variant: "destructive" });
      return;
    }
    let name = "";
    let email = "";
    let rid = "";
    if (resourceType === "tech") {
      const w = workers.find((x) => x.id === resourceId);
      if (!w) { toast({ title: "Select a tech", variant: "destructive" }); return; }
      name = w.name; email = w.email || ""; rid = w.id;
    } else {
      if (!equipmentName.trim()) { toast({ title: "Equipment name required", variant: "destructive" }); return; }
      name = equipmentName.trim(); rid = equipmentName.trim();
    }
    const proj = projects.find((p) => p.id === projectId);
    const ph = phasesForProject.find((p) => p.id === phaseId);
    setSaving(true);
    try {
      await base44.entities.ResourceAllocation.create({
        organization_id: organizationId,
        resource_type: resourceType,
        resource_id: rid,
        resource_name: name,
        resource_email: email,
        project_id: projectId || null,
        project_name: proj?.name || "",
        phase_id: phaseId || null,
        phase_name: ph?.display_name || ph?.phase_name || "",
        start_date: startDate,
        end_date: endDate,
        role: role || null,
        notes: notes || null,
      });
      toast({ title: "Assignment saved", description: `${name} → ${proj?.name || "Unassigned"}` });
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast({ title: "Save failed", description: e?.message || "Could not save assignment.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New resource assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Resource type</Label>
              <Select value={resourceType} onValueChange={(v) => { setResourceType(v); setResourceId(""); setEquipmentName(""); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{resourceType === "tech" ? "Tech" : "Equipment name"}</Label>
              {resourceType === "tech" ? (
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select tech" /></SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}{w.role ? ` — ${w.role}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="mt-1" placeholder="e.g. Ford Transit #2" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} />
              )}
            </div>
          </div>

          <div>
            <Label>Project</Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setPhaseId(""); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {phasesForProject.length > 0 && (
            <div>
              <Label>Phase (optional)</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="No phase" /></SelectTrigger>
                <SelectContent>
                  {phasesForProject.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.display_name || p.phase_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Role (optional)</Label>
            <Input className="mt-1" placeholder="e.g. Lead, Helper, Operator" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} loading={saving}>Save assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}