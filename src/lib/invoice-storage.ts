export type ServiceLine = {
  id: string;
  name: string;
  unit: string; // e.g. "per piece", "fixed"
  rate: number;
  qty: number;
};

export type Invoice = {
  id: string;
  customerName: string;
  eventDate: string; // ISO date
  phone?: string;
  lines: ServiceLine[];
  discount: number;
  total: number;
  createdAt: string;
};

const KEY = "khushdil_invoices_v1";

export function loadInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Invoice[];
  } catch {
    return [];
  }
}

export function saveInvoice(inv: Invoice) {
  const all = loadInvoices();
  const next = [inv, ...all.filter((i) => i.id !== inv.id)];
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function deleteInvoice(id: string) {
  const next = loadInvoices().filter((i) => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export const DEFAULT_SERVICES: Omit<ServiceLine, "id" | "qty">[] = [
  { name: "Box Setup (2 Box)", unit: "set", rate: 1200 },
  { name: "Chair", unit: "per piece", rate: 5 },
  { name: "Table", unit: "per piece", rate: 50 },
  { name: "Tent 15x15", unit: "fixed", rate: 600 },
  { name: "Generator", unit: "fixed", rate: 500 },
  { name: "Transport", unit: "fixed", rate: 200 },
];
