import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Save, X, Plus, Trash2, Link2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import RecordAuditInfo from '@/components/ui/RecordAuditInfo';
import { stampCreate, stampUpdate } from '@/lib/audit';
import { fmtMoney, roundCents } from '@/lib/money';

// B14-11 A2: a money value that is absent stays null (shown as MISSING), never coerced to 0.
const moneyOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? roundCents(n) : null;
};
const lineTotalOf = (li) => roundCents((Number(li.quantity) || 0) * (Number(li.unit_price) || 0));

const emptyLine = () => ({ description: '', quantity: 1, unit: 'EA', unit_price: 0, total: 0 });

// `invoices` (optional, B14-11 A2): the invoices the parent page already loaded, used only for invoiced-to-date.
export default function PurchaseInvoiceForm({ invoice, rateCards = [], suppliers = [], purchaseOrders = [], invoices, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
    supplier_name: '',
    line_items: [],
    subtotal: 0,
    tax_amount: 0,
    shipping_amount: 0,
    total_amount: 0,
    status: 'Draft',
    linked_po_id: '',
    payment_terms: 'Net 30',
    notes: '',
  });

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else {
      setFormData((prev) => ({ ...prev, invoice_number: `PINV-${Date.now().toString().slice(-8)}` }));
    }
  }, [invoice]);

  const recalc = (items, tax = formData.tax_amount || 0, shipping = formData.shipping_amount || 0) => {
    const subtotal = roundCents(items.reduce((s, i) => s + lineTotalOf(i), 0));
    const tax_amount = roundCents(Number(tax) || 0);
    const shipping_amount = roundCents(Number(shipping) || 0);
    return { subtotal, tax_amount, shipping_amount, total_amount: roundCents(subtotal + tax_amount + shipping_amount) };
  };

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const addLine = () => set({ line_items: [...formData.line_items, emptyLine()] });

  const updateLine = (idx, field, value) => {
    const items = [...formData.line_items];
    items[idx] = { ...items[idx], [field]: value };
    items[idx].total = lineTotalOf(items[idx]);
    set({ line_items: items, ...recalc(items) });
  };

  // Pick a Rate Card item into a line (fills description, unit, unit_price)
  const pickRateCard = (idx, itemName) => {
    const rc = rateCards.find((r) => r.item_name === itemName);
    const items = [...formData.line_items];
    items[idx] = {
      ...items[idx],
      description: rc ? rc.item_name : items[idx].description,
      unit: rc ? rc.unit || 'EA' : items[idx].unit,
      unit_price: rc ? rc.unit_price || 0 : items[idx].unit_price,
    };
    items[idx].total = lineTotalOf(items[idx]);
    set({ line_items: items, ...recalc(items) });
  };

  const removeLine = (idx) => {
    const items = formData.line_items.filter((_, i) => i !== idx);
    set({ line_items: items, ...recalc(items) });
  };

  // Link to PO — pre-fill lines, tax and shipping from the PO (B14-11 A2).
  // The invoice stores what the vendor actually billed; edits after linking are allowed and show as variance.
  const linkToPO = (poId) => {
    if (!poId || poId === 'none') { set({ linked_po_id: '' }); return; }
    const po = purchaseOrders.find((p) => p.id === poId);
    const lines = (po?.line_items || []).map((li) => {
      const line = {
        description: li.description || '',
        quantity: Number(li.quantity) || 0,
        unit: li.unit || 'EA',
        unit_price: roundCents(Number(li.unit_price) || 0),
        cost_code: li.cost_code || '',
      };
      if (li.line_id) line.po_line_id = li.line_id;
      line.total = lineTotalOf(line);
      return line;
    });
    const poTax = moneyOrNull(po?.tax);
    const poShipping = moneyOrNull(po?.shipping);
    set({
      linked_po_id: poId,
      supplier_name: formData.supplier_name || po?.vendor || '',
      line_items: lines,
      ...recalc(lines, poTax ?? (formData.tax_amount || 0), poShipping ?? (formData.shipping_amount || 0)),
    });
  };

  // Read-only variance vs the linked PO (B14-11 A2). Flag only: $0.00 tolerance, never blocks save.
  const variance = (() => {
    if (!formData.linked_po_id) return null;
    const po = purchaseOrders.find((p) => p.id === formData.linked_po_id);
    if (!po) return { poMissing: true };
    const thisTotal = roundCents(Number(formData.total_amount) || 0);
    const poTotal = moneyOrNull(po.total);
    const poTax = moneyOrNull(po.tax);
    const poShipping = moneyOrNull(po.shipping);
    let invoicedToDate = null;
    if (Array.isArray(invoices)) {
      const others = invoices.filter((inv) => inv && inv.linked_po_id === po.id && (!invoice || inv.id !== invoice.id));
      invoicedToDate = roundCents(others.reduce((s, inv) => s + (Number(inv.total_amount) || 0), 0) + thisTotal);
    }
    const diff = (a, b) => (a === null || b === null ? null : roundCents(a - b));
    return {
      po,
      poTotal,
      thisTotal,
      totalDiff: diff(thisTotal, poTotal),
      taxDiff: diff(roundCents(Number(formData.tax_amount) || 0), poTax),
      shippingDiff: diff(roundCents(Number(formData.shipping_amount) || 0), poShipping),
      invoicedToDate,
      remaining: diff(poTotal, invoicedToDate),
    };
  })();
  const showMoney = (v) => (v === null || v === undefined ? 'MISSING' : fmtMoney(v));
  const showDiff = (v) => (v === null || v === undefined ? 'MISSING' : v === 0 ? '$0.00' : (v > 0 ? '+' : '') + fmtMoney(v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = invoice ? await stampUpdate(formData) : await stampCreate(formData);
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader className="bg-slate-50">
        <CardTitle>{invoice ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}</CardTitle>
        {invoice && <RecordAuditInfo record={invoice} className="pt-1" />}
      </CardHeader>
      <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Invoice Number</Label>
            <Input name="invoice_number" value={formData.invoice_number} onChange={(e) => set({ invoice_number: e.target.value })} required />
          </div>
          <div>
            <Label>Invoice Date</Label>
            <Input type="date" value={formData.invoice_date} onChange={(e) => set({ invoice_date: e.target.value })} required />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input type="date" value={formData.due_date} onChange={(e) => set({ due_date: e.target.value })} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Supplier</Label>
            <Input list="supplier-list" value={formData.supplier_name} onChange={(e) => set({ supplier_name: e.target.value })} placeholder="Type or pick a supplier" required />
            <datalist id="supplier-list">
              {suppliers.map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
          <div>
            <Label><Link2 className="inline h-3.5 w-3.5 mr-1" />Link to PO (pre-fill lines)</Label>
            <Select value={formData.linked_po_id || 'none'} onValueChange={linkToPO}>
              <SelectTrigger><SelectValue placeholder="No PO link" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No PO link</SelectItem>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>{po.po_number || 'PO'} — {po.vendor || 'vendor'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Line Items</Label>
            <Button type="button" size="sm" onClick={addLine}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
          </div>
          <div className="space-y-2">
            {formData.line_items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end border-b border-slate-100 pb-2">
                <div className="col-span-12 md:col-span-4">
                  <Label className="text-[10px]">Description</Label>
                  <Input value={item.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} placeholder="Free text or pick below" />
                  <Input list="ratecard-list" value="" onChange={(e) => e.target.value && pickRateCard(idx, e.target.value)} placeholder="Pick from Rate Card" className="mt-1 text-xs h-8" />
                  {item.cost_code ? <p className="text-[10px] text-slate-500 mt-1">Cost code: {item.cost_code}</p> : null}
                </div>
                <div className="col-span-3 md:col-span-2">
                  <Label className="text-[10px]">Qty</Label>
                  <Input type="number" value={item.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <Label className="text-[10px]">Unit</Label>
                  <Input value={item.unit} onChange={(e) => updateLine(idx, 'unit', e.target.value)} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <Label className="text-[10px]">Price</Label>
                  <Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <Label className="text-[10px]">Total</Label>
                  <p className="text-sm font-semibold pt-2">${(item.total || 0).toFixed(2)}</p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {formData.line_items.length === 0 && <p className="text-xs text-slate-400">No line items yet. Add one or link a PO.</p>}
          </div>
          <datalist id="ratecard-list">
            {rateCards.map((r) => <option key={r.id} value={r.item_name} />)}
          </datalist>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between items-center"><span>Subtotal:</span><span className="font-semibold">${(formData.subtotal || 0).toFixed(2)}</span></div>
            <div className="flex justify-between items-center"><span>Tax:</span>
              <Input type="number" step="0.01" value={formData.tax_amount || 0} onChange={(e) => set(recalc(formData.line_items, e.target.value))} className="w-24 h-8 text-right" />
            </div>
            <div className="flex justify-between items-center"><span>Shipping:</span>
              <Input type="number" step="0.01" value={formData.shipping_amount || 0} onChange={(e) => set(recalc(formData.line_items, formData.tax_amount || 0, e.target.value))} className="w-24 h-8 text-right" />
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total:</span><span>${(formData.total_amount || 0).toFixed(2)}</span></div>
          </div>
        </div>

        {variance && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1" aria-live="polite">
            <p className="font-semibold flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> PO match (read-only, does not block save)</p>
            {variance.poMissing ? (
              <p>Linked PO is not in the loaded PO list for this project: PO total MISSING.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 tabular-nums">
                <span>PO {variance.po.po_number || ''} total</span><span className="text-right">{showMoney(variance.poTotal)}</span>
                <span>This invoice total</span><span className="text-right">{showMoney(variance.thisTotal)}</span>
                <span>Difference (invoice − PO)</span><span className={`text-right ${variance.totalDiff ? 'font-semibold' : ''}`}>{showDiff(variance.totalDiff)}</span>
                <span>Tax difference</span><span className="text-right">{showDiff(variance.taxDiff)}</span>
                <span>Shipping difference</span><span className="text-right">{showDiff(variance.shippingDiff)}</span>
                <span>Invoiced to date (incl. this)</span><span className="text-right">{showMoney(variance.invoicedToDate)}</span>
                <span>PO remaining</span><span className={`text-right ${variance.remaining !== null && variance.remaining < 0 ? 'font-semibold' : ''}`}>{showMoney(variance.remaining)}</span>
              </div>
            )}
            {variance.remaining !== null && variance.remaining < 0 && <p className="font-semibold">Over-billed vs PO by {fmtMoney(Math.abs(variance.remaining))}.</p>}
            {variance.invoicedToDate === null && !variance.poMissing && <p>Invoiced to date: MISSING (invoice list not available to this form).</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Payment Terms</Label>
            <Input value={formData.payment_terms} onChange={(e) => set({ payment_terms: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={formData.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Cancel</Button>
        <Button type="submit"><Save className="w-4 h-4 mr-2" /> Save</Button>
      </CardFooter>
    </form>
  );
}