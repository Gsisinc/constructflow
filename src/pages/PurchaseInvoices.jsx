import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useOrgProjects } from '@/hooks/useProjectData';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import PurchaseInvoiceForm from '../components/invoices/PurchaseInvoiceForm';
import { fmtDate } from '@/lib/dates';

export default function PurchaseInvoices() {
  const { user } = useAuth();
  const { data: projects = [] } = useOrgProjects(user?.organization_id);
  const [selectedProject, setSelectedProject] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projects.length && !selectedProject) setSelectedProject(projects[0]);
    setLoading(false);
  }, [projects, selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      loadInvoices();
      loadPOs();
    }
  }, [selectedProject]);

  useEffect(() => {
    // Rate cards + suppliers are org-wide, load once
    base44.entities.RateCard.filter({}, { limit: 500 }).then((r) => setRateCards(r?.items || r || [])).catch(() => {});
    base44.entities.Supplier.filter({}, { limit: 500 }).then((r) => setSuppliers(r?.items || r || [])).catch(() => {});
  }, []);

  const loadInvoices = async () => {
    if (!selectedProject) return;
    try {
      const res = await base44.entities.PurchaseInvoice.filter({ project_id: selectedProject.id }, { sort: '-invoice_date', limit: 200 });
      setInvoices(res?.items || res || []);
    } catch (e) { console.error(e); }
  };

  const loadPOs = async () => {
    if (!selectedProject) return;
    try {
      const res = await base44.entities.PurchaseOrder.filter({ project_id: selectedProject.id }, { limit: 100 });
      setPurchaseOrders(res?.items || res || []);
    } catch (e) { console.error(e); }
  };

  const handleSave = async (data) => {
    try {
      const payload = { ...data, project_id: selectedProject.id, organization_id: user?.organization_id };
      if (editing) {
        await base44.entities.PurchaseInvoice.update(editing.id, payload);
      } else {
        await base44.entities.PurchaseInvoice.create(payload);
      }
      setShowForm(false);
      setEditing(null);
      await loadInvoices();
      toast.success('Purchase invoice saved');
    } catch (e) {
      console.error(e);
      toast.error('Save failed: ' + (e.message || ''));
    }
  };

  // B14-11 A3 (client-side only; the PO query above is unchanged).
  // Hide cancelled POs from the invoice picker, but keep the PO this invoice is already linked to so the select still shows it.
  const pickerPOs = purchaseOrders.filter((po) => po && (po.status !== 'cancelled' || (editing && po.id === editing.linked_po_id)));
  const hiddenCancelledCount = purchaseOrders.length - pickerPOs.length;
  // "POs without a project": count only, from data already loaded. NOTE: loadPOs filters by project_id,
  // so POs with no project (D1-type) are never returned here; this count can only catch blank/mismatched project_id
  // values that slip through. A true org-wide count needs a separate PO query (not added; see README A3).
  const posWithoutProjectCount = purchaseOrders.filter((po) => po && !po.project_id).length;

  if (loading && !user) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Purchase Invoices</h1>
          <p className="text-slate-500 mt-1">
            {selectedProject ? `${selectedProject.name} • ${invoices.length} invoices` : 'Select a project to manage purchases'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => setSelectedProject(projects.find((p) => p.id === e.target.value) || null)}
            className="border border-slate-200 rounded-md px-3 py-2.5 text-sm bg-white h-10"
            disabled={projects.length === 0}
          >
            {projects.length === 0 && <option value="">No projects yet</option>}
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} disabled={!selectedProject}>
            <Plus className="w-4 h-4 mr-2" /> New Purchase
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Projects Yet</h2>
          <p className="text-slate-500">Create a project first, then record supplier purchase invoices against it.</p>
        </div>
      ) : !selectedProject ? null : (
        <>
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
                <PurchaseInvoiceForm
                  invoice={editing}
                  rateCards={rateCards}
                  suppliers={suppliers}
                  purchaseOrders={pickerPOs}
                  invoices={invoices}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditing(null); }}
                />
              </div>
            </div>
          )}

          {(hiddenCancelledCount > 0 || posWithoutProjectCount > 0) && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
              {hiddenCancelledCount > 0 && <span>{hiddenCancelledCount} cancelled PO{hiddenCancelledCount === 1 ? '' : 's'} hidden from the PO picker</span>}
              {posWithoutProjectCount > 0 && <span>⚠ POs without a project: {posWithoutProjectCount}</span>}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">PO Link</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-400 py-10">No purchase invoices yet. Click New Purchase to add one.</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3">{inv.supplier_name}</td>
                    <td className="px-4 py-3">{fmtDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3">{inv.linked_po_id ? <Badge variant="outline" className="bg-blue-50 text-blue-700">Linked</Badge> : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">${(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3"><Badge className={inv.status === 'Paid' ? 'bg-green-100 text-green-700' : inv.status === 'Received' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>{inv.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(inv); setShowForm(true); }}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}