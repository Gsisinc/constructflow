// Financial entities mapping from Base44
import { base44 } from '@/api/base44Client';

// Export all entities used by AccuPro financial module
export const Company = base44.entities.Company || {};
export const Account = base44.entities.Account || {};
export const Transaction = base44.entities.Transaction || {};
export const User = base44.auth;
export const CompanyUser = base44.entities.CompanyUser || {};
export const SalesInvoice = base44.entities.SalesInvoice || {};
export const PurchaseInvoice = base44.entities.PurchaseInvoice || {};
export const Product = base44.entities.Product || {};
export const InventoryStock = base44.entities.InventoryStock || {};
export const BatchStock = base44.entities.BatchStock || {};
export const Batch = base44.entities.Batch || {};
export const Warehouse = base44.entities.Warehouse || {};
export const WarehouseLocation = base44.entities.WarehouseLocation || {};
export const Report = base44.entities.Report || {};
export const Query = base44.entities.Query || {};

// Re-export base44 for direct access
export { base44 };
