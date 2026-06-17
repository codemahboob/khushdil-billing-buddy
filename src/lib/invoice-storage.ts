import { BUSINESS } from "./business";

export type ServiceLine = {
  id: string;
  name: string;
  unit: string;
  rate: number;
  qty: number;
  description?: string;
};

export type Invoice = {
  id: string;
  invoiceNo: number;
  customerName: string;
  eventDate: string;
  phone?: string;
  address?: string;
  lines: ServiceLine[];
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  deletedAt?: string | null;
};

const KEY = "khushdil_invoices_v2";
const CUSTOM_KEY = "khushdil_custom_items_v1";
const COUNTER_KEY = "khushdil_invoice_counter_v1";

export function loadAll(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Invoice[];
  } catch {
    return [];
  }
}

function writeAll(list: Invoice[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function loadInvoices(): Invoice[] {
  return loadAll().filter((i) => !i.deletedAt);
}

export function loadDeleted(): Invoice[] {
  return loadAll().filter((i) => !!i.deletedAt);
}

export function saveInvoice(inv: Invoice) {
  const all = loadAll();
  const next = [inv, ...all.filter((i) => i.id !== inv.id)];
  writeAll(next);
}

export function softDeleteInvoice(id: string) {
  const all = loadAll().map((i) =>
    i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i,
  );
  writeAll(all);
}

export function restoreInvoice(id: string) {
  const all = loadAll().map((i) =>
    i.id === id ? { ...i, deletedAt: null } : i,
  );
  writeAll(all);
}

export function permanentlyDelete(id: string) {
  writeAll(loadAll().filter((i) => i.id !== id));
}

export function emptyBin() {
  writeAll(loadAll().filter((i) => !i.deletedAt));
}

export function nextInvoiceNo(): number {
  if (typeof window === "undefined") return BUSINESS.invoiceStart;
  const raw = localStorage.getItem(COUNTER_KEY);
  const current = raw ? Number(raw) : 0;
  const all = loadAll();
  const maxExisting = all.reduce((m, i) => Math.max(m, i.invoiceNo || 0), 0);
  const base = Math.max(current, maxExisting, BUSINESS.invoiceStart - 1);
  const next = base + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return next;
}

export function formatInvoiceNo(n: number) {
  return `#${BUSINESS.invoicePrefix}${n}`;
}

export type PresetItem = Omit<ServiceLine, "id" | "qty">;

export const BUILTIN_SERVICES: PresetItem[] = [
  { name: "Box Setup (2 Box)", unit: "set", rate: 1200 },
  { name: "Chair", unit: "per piece", rate: 5 },
  { name: "Table", unit: "per piece", rate: 50 },
  { name: "Tent 15x15", unit: "fixed", rate: 600 },
  { name: "Generator", unit: "fixed", rate: 500 },
  { name: "Transport", unit: "fixed", rate: 200 },
];

export function loadCustomItems(): PresetItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as PresetItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomItems(items: PresetItem[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(items));
}

export function getAllPresets(): PresetItem[] {
  return [...BUILTIN_SERVICES, ...loadCustomItems()];
}

// Back-compat alias used in older code paths
export const DEFAULT_SERVICES = BUILTIN_SERVICES;
