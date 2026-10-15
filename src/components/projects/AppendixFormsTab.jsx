import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { APPENDIX_FORMS, emptyFormData, checklistProgress } from '@/lib/appendixFormsConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, FileText, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

export default function AppendixFormsTab({ projectId }) {
  const qc = useQueryClient();
  const [view, setView] = useState('overview'); // overview | list | editor
  const [activeId, setActiveId] = useState(null);
  const [editing, setEditing] = useState(null); // record being edited (or {} for new)

  const listQuery = useQuery({
    queryKey: ['projectForms', projectId],
    queryFn: () => base44.entities.ProjectForm.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }),
    enabled: !!projectId,
  });

  const records = listQuery.data?.items || listQuery.data || [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['projectForms', projectId] });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) return base44.entities.ProjectForm.update(id, data);
      return base44.entities.ProjectForm.create(data);
    },
    onSuccess: () => { invalidate(); setView('list'); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectForm.delete(id),
    onSuccess: invalidate,
  });

  const counts = useMemo(() => {
    const c = {};
    APPENDIX_FORMS.forEach((f) => (c[f.id] = 0));
    records.forEach((r) => { if (c[r.appendix] != null) c[r.appendix]++; });
    return c;
  }, [records]);

  // Overview: 9 appendix cards
  if (view === 'overview') {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Field Manual Forms</h2>
            <p className="text-sm text-slate-500">Appendix A–I forms, saved per project. Fillable, editable, reusable.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPENDIX_FORMS.map((f) => {
            const saved = records.filter((r) => r.appendix === f.id);
            const prog = f.type === 'checklist' && saved[0]
              ? checklistProgress(f, saved[0].form_data)
              : null;
            return (
              <Card key={f.id} className="hover:shadow-md transition-shadow cursor-pointer" >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{f.title}</CardTitle>
                    <Badge variant="outline" className="bg-gold-50 text-gold-700 border-gold-200 shrink-0">{f.id}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {f.type === 'checklist' ? `Checklist · ${f.rows.length} items` : `Form · ${f.rows.length} fields`}
                    </span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">{saved.length} saved</Badge>
                  </div>
                  {prog && <p className="text-xs text-slate-500 mt-2">{prog.done}/{prog.total} done (latest)</p>}
                  <Button size="sm" className="w-full mt-3" onClick={() => { setActiveId(f.id); setView('list'); }}>
                    <FileText className="h-4 w-4 mr-1.5" /> Open
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const activeForm = APPENDIX_FORMS.find((f) => f.id === activeId);

  // Editor view
  if (view === 'editor' && activeForm && editing) {
    return (
      <FormEditor
        formDef={activeForm}
        record={editing.id ? editing : null}
        projectId={projectId}
        saving={saveMutation.isPending}
        onSave={(form_data) => {
          const payload = {
            project_id: projectId,
            appendix: activeForm.id,
            title: activeForm.title,
            form_data,
            status: 'draft',
          };
          saveMutation.mutate({ id: editing.id || null, data: payload });
        }}
        onCancel={() => { setView('list'); setEditing(null); }}
      />
    );
  }

  // List view for active appendix
  const saved = records.filter((r) => r.appendix === activeId);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('overview')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All forms
          </Button>
          <h2 className="text-lg font-semibold text-slate-900">{activeForm?.title}</h2>
        </div>
        <Button size="sm" onClick={() => { setEditing({}); setView('editor'); }}>
          <Plus className="h-4 w-4 mr-1.5" /> New {activeForm?.title.replace(/^Appendix [A-I]: /, '')}
        </Button>
      </div>

      {listQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : saved.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-slate-500">
          No saved {activeForm?.title} yet. Click <span className="font-medium text-slate-700">New</span> to start one.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {saved.map((r) => {
            const prog = activeForm.type === 'checklist' ? checklistProgress(activeForm, r.form_data) : null;
            return (
              <Card key={r.id} className="hover:shadow-sm">
                <CardContent className="py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900">
                        {r.form_data?.[activeForm.rows[0]?.key] && typeof r.form_data[activeForm.rows[0].key] === 'string'
                          ? r.form_data[activeForm.rows[0].key]
                          : `${activeForm.title} instance`}
                      </span>
                      <Badge variant="outline" className="bg-slate-50 text-slate-600">{r.status}</Badge>
                      {prog && <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{prog.done}/{prog.total} done</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Updated {fmtDate(r.updated_date || r.created_date)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(r); setView('editor'); }}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Open / Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50"
                      onClick={() => { if (confirm('Delete this saved form?')) deleteMutation.mutate(r.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormEditor({ formDef, record, projectId, saving, onSave, onCancel }) {
  const [data, setData] = useState(() => {
    const existing = record?.form_data;
    if (existing && Object.keys(existing).length) {
      // merge with empty defaults so all rows present
      const merged = emptyFormData(formDef);
      Object.keys(merged).forEach((k) => {
        if (existing[k] != null) merged[k] = existing[k];
      });
      return merged;
    }
    return emptyFormData(formDef);
  });

  const setRow = (key, patch) => {
    setData((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
  };
  const setField = (key, val) => {
    setData((d) => ({ ...d, [key]: val }));
  };

  const prog = checklistProgress(formDef, data);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{formDef.title}</h2>
            <p className="text-sm text-slate-500">
              {formDef.type === 'checklist' ? 'Check each item Done and add notes.' : 'Fill in each field below.'}
            </p>
          </div>
          {prog && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              {prog.done}/{prog.total} done
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {formDef.rows.map((row) => (
            <div key={row.key} className={formDef.type === 'checklist'
              ? 'flex flex-col sm:flex-row sm:items-start gap-3 border-b border-slate-100 pb-3'
              : 'grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 border-b border-slate-100 pb-3'}>
              {formDef.type === 'checklist' ? (
                <>
                  <div className="flex items-start gap-2 md:w-1/2">
                    <Checkbox
                      checked={!!data[row.key]?.done}
                      onCheckedChange={(v) => setRow(row.key, { done: v })}
                      className="mt-0.5"
                    />
                    <span className={data[row.key]?.done ? 'text-sm text-slate-500 line-through' : 'text-sm text-slate-800'}>
                      {row.label}
                    </span>
                  </div>
                  <Input
                    placeholder="Notes"
                    value={data[row.key]?.notes || ''}
                    onChange={(e) => setRow(row.key, { notes: e.target.value })}
                    className="md:w-1/2"
                  />
                </>
              ) : (
                <>
                  <label className="text-sm font-medium text-slate-700 md:col-span-1">{row.label}</label>
                  {row.key === 'b2' || row.key === 'f6' ? (
                    <Input value={data[row.key] || ''} onChange={(e) => setField(row.key, e.target.value)} className="md:col-span-2" />
                  ) : (
                    <Textarea value={data[row.key] || ''} onChange={(e) => setField(row.key, e.target.value)}
                      className="md:col-span-2 min-h-[60px]" />
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={() => onSave(data)} disabled={saving}>
            {saving ? 'Saving…' : (record ? 'Save changes' : 'Save form')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}