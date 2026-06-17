import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEFAULT_SERVICES,
  type Invoice,
  type ServiceLine,
  deleteInvoice,
  loadInvoices,
  saveInvoice,
} from "@/lib/invoice-storage";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khushdil Tent & DJ — Invoice" },
      { name: "description", content: "Create invoices and track upcoming events for Khushdil Tent & DJ." },
    ],
  }),
  component: App,
});

type Step = "home" | "customer" | "services" | "review";

function App() {
  const [step, setStep] = useState<Step>("home");
  const [draft, setDraft] = useState<Invoice>(() => emptyInvoice());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInvoices(loadInvoices());
    setMounted(true);
  }, []);

  const reset = () => {
    setDraft(emptyInvoice());
    setStep("home");
  };

  const finalize = () => {
    const total = draft.lines.reduce((s, l) => s + l.rate * l.qty, 0) - draft.discount;
    const final = { ...draft, total };
    saveInvoice(final);
    generateInvoicePDF(final);
    setInvoices(loadInvoices());
    reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-10">
        <Header />

        <AnimatePresence mode="wait">
          {step === "home" && (
            <Pane key="home">
              <HomeScreen
                onAdd={() => {
                  setDraft(emptyInvoice());
                  setStep("customer");
                }}
                invoices={mounted ? invoices : []}
                onOpen={(inv) => generateInvoicePDF(inv)}
                onDelete={(id) => {
                  deleteInvoice(id);
                  setInvoices(loadInvoices());
                }}
              />
            </Pane>
          )}
          {step === "customer" && (
            <Pane key="customer">
              <CustomerStep
                draft={draft}
                onBack={() => setStep("home")}
                onNext={(d) => {
                  setDraft(d);
                  setStep("services");
                }}
              />
            </Pane>
          )}
          {step === "services" && (
            <Pane key="services">
              <ServicesStep
                draft={draft}
                onBack={() => setStep("customer")}
                onNext={(d) => {
                  setDraft(d);
                  setStep("review");
                }}
              />
            </Pane>
          )}
          {step === "review" && (
            <Pane key="review">
              <ReviewStep
                draft={draft}
                onBack={() => setStep("services")}
                onConfirm={finalize}
                onDiscount={(v) => setDraft({ ...draft, discount: v })}
              />
            </Pane>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Khushdil Tent & DJ
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Invoices</h1>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
        K
      </div>
    </div>
  );
}

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Home ---------- */

function HomeScreen({
  onAdd,
  invoices,
  onOpen,
  onDelete,
}: {
  onAdd: () => void;
  invoices: Invoice[];
  onOpen: (i: Invoice) => void;
  onDelete: (id: string) => void;
}) {
  const upcoming = useMemo(
    () =>
      invoices
        .filter((i) => new Date(i.eventDate) >= startOfToday())
        .sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate)),
    [invoices],
  );
  const past = useMemo(
    () =>
      invoices
        .filter((i) => new Date(i.eventDate) < startOfToday())
        .sort((a, b) => +new Date(b.eventDate) - +new Date(a.eventDate)),
    [invoices],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 py-10">
        <h2 className="text-5xl font-extrabold tracking-tight">Hello,</h2>
        <button
          onClick={onAdd}
          className="group inline-flex items-center gap-3 rounded-full border-2 border-dashed border-primary px-4 py-2 pr-5 text-primary transition hover:bg-primary/5 active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-primary shadow-soft transition group-hover:shadow-pop">
            <PlusIcon />
          </span>
          <span className="text-lg font-semibold">Add Name</span>
        </button>
      </div>

      <Section title="Upcoming Events" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <EmptyHint text="Tap Add Name to create your first invoice." />
        ) : (
          upcoming.map((i) => (
            <InvoiceCard key={i.id} inv={i} onOpen={onOpen} onDelete={onDelete} upcoming />
          ))
        )}
      </Section>

      {past.length > 0 && (
        <Section title="Past" count={past.length}>
          {past.map((i) => (
            <InvoiceCard key={i.id} inv={i} onOpen={onOpen} onDelete={onDelete} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-bold">{title}</h3>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function InvoiceCard({
  inv,
  onOpen,
  onDelete,
  upcoming,
}: {
  inv: Invoice;
  onOpen: (i: Invoice) => void;
  onDelete: (id: string) => void;
  upcoming?: boolean;
}) {
  const date = new Date(inv.eventDate);
  return (
    <div className="group flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft transition hover:shadow-pop">
      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {date.toLocaleDateString(undefined, { month: "short" })}
        </span>
        <span className="text-lg font-bold leading-none">{date.getDate()}</span>
      </div>
      <button onClick={() => onOpen(inv)} className="flex-1 text-left">
        <div className="font-semibold">{inv.customerName}</div>
        <div className="text-xs text-muted-foreground">
          {upcoming ? formatRelative(date) : date.toLocaleDateString()} · Rs {inv.total}
        </div>
      </button>
      <button
        onClick={() => onOpen(inv)}
        className="hidden rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground sm:inline-flex"
      >
        PDF
      </button>
      <button
        onClick={() => {
          if (confirm("Delete this invoice?")) onDelete(inv.id);
        }}
        className="text-muted-foreground transition hover:text-destructive"
        aria-label="Delete"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

/* ---------- Step: Customer ---------- */

function CustomerStep({
  draft,
  onBack,
  onNext,
}: {
  draft: Invoice;
  onBack: () => void;
  onNext: (d: Invoice) => void;
}) {
  const [name, setName] = useState(draft.customerName);
  const [date, setDate] = useState(draft.eventDate);
  const [phone, setPhone] = useState(draft.phone ?? "");

  const valid = name.trim().length > 0 && !!date;

  return (
    <StepShell
      step={1}
      total={3}
      title="Customer details"
      subtitle="Who is the event for?"
      onBack={onBack}
    >
      <Field label="Customer name">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rajesh Kumar"
          className="input-base"
        />
      </Field>
      <Field label="Event date">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-base"
        />
      </Field>
      <Field label="Phone (optional)">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91"
          inputMode="tel"
          className="input-base"
        />
      </Field>

      <StickyCTA
        disabled={!valid}
        label="Continue"
        onClick={() => onNext({ ...draft, customerName: name.trim(), eventDate: date, phone: phone.trim() })}
      />
    </StepShell>
  );
}

/* ---------- Step: Services ---------- */

function ServicesStep({
  draft,
  onBack,
  onNext,
}: {
  draft: Invoice;
  onBack: () => void;
  onNext: (d: Invoice) => void;
}) {
  const [lines, setLines] = useState<ServiceLine[]>(draft.lines.length ? draft.lines : []);
  const [showCustom, setShowCustom] = useState(false);

  const total = lines.reduce((s, l) => s + l.rate * l.qty, 0);

  const addPreset = (preset: (typeof DEFAULT_SERVICES)[number]) => {
    setLines((cur) => [
      ...cur,
      { ...preset, id: crypto.randomUUID(), qty: 1 },
    ]);
  };

  const update = (id: string, patch: Partial<ServiceLine>) =>
    setLines((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const remove = (id: string) => setLines((cur) => cur.filter((l) => l.id !== id));

  return (
    <StepShell
      step={2}
      total={3}
      title="Services"
      subtitle="Add what you'll provide for this event."
      onBack={onBack}
    >
      {lines.length > 0 && (
        <div className="mb-4 space-y-2">
          {lines.map((l) => (
            <div key={l.id} className="rounded-2xl bg-card p-3 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.unit} · Rs {l.rate}</div>
                </div>
                <button
                  onClick={() => remove(l.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <TrashIcon />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Stepper
                  value={l.qty}
                  onChange={(v) => update(l.id, { qty: Math.max(1, v) })}
                />
                <div className="ml-auto text-right text-sm">
                  <span className="text-muted-foreground">Amount</span>{" "}
                  <span className="font-bold">Rs {l.rate * l.qty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Quick add
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DEFAULT_SERVICES.map((s) => (
          <button
            key={s.name}
            onClick={() => addPreset(s)}
            className="rounded-2xl bg-secondary p-3 text-left transition hover:bg-accent hover:text-accent-foreground"
          >
            <div className="text-sm font-semibold">{s.name}</div>
            <div className="text-xs text-muted-foreground">Rs {s.rate} · {s.unit}</div>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {showCustom ? (
          <CustomServiceForm
            onAdd={(svc) => {
              setLines((c) => [...c, { ...svc, id: crypto.randomUUID() }]);
              setShowCustom(false);
            }}
            onCancel={() => setShowCustom(false)}
          />
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full rounded-2xl border-2 border-dashed border-primary/60 p-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            + Add custom service
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-card p-4 shadow-soft">
        <span className="text-sm text-muted-foreground">Running total</span>
        <span className="text-xl font-bold">Rs {total}</span>
      </div>

      <StickyCTA
        disabled={lines.length === 0}
        label="Continue to Billing"
        onClick={() => onNext({ ...draft, lines })}
      />
    </StepShell>
  );
}

function CustomServiceForm({
  onAdd,
  onCancel,
}: {
  onAdd: (s: Omit<ServiceLine, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState("fixed");
  const [qty, setQty] = useState(1);

  const valid = name.trim() && Number(rate) > 0;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <input
        autoFocus
        placeholder="Service name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-base mb-2"
      />
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          placeholder="Rate (Rs)"
          inputMode="numeric"
          value={rate}
          onChange={(e) => setRate(e.target.value.replace(/[^0-9]/g, ""))}
          className="input-base"
        />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-base">
          <option value="fixed">fixed</option>
          <option value="per piece">per piece</option>
          <option value="set">set</option>
          <option value="per hour">per hour</option>
        </select>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Quantity</span>
        <Stepper value={qty} onChange={(v) => setQty(Math.max(1, v))} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          Cancel
        </button>
        <button
          disabled={!valid}
          onClick={() =>
            onAdd({ name: name.trim(), rate: Number(rate), unit, qty })
          }
          className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ---------- Step: Review ---------- */

function ReviewStep({
  draft,
  onBack,
  onConfirm,
  onDiscount,
}: {
  draft: Invoice;
  onBack: () => void;
  onConfirm: () => void;
  onDiscount: (v: number) => void;
}) {
  const subtotal = draft.lines.reduce((s, l) => s + l.rate * l.qty, 0);
  const total = subtotal - draft.discount;

  return (
    <StepShell step={3} total={3} title="Billing" subtitle="Review and generate the invoice." onBack={onBack}>
      <div className="rounded-2xl bg-card p-5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Bill to</div>
            <div className="mt-1 text-lg font-bold">{draft.customerName}</div>
            {draft.phone && <div className="text-xs text-muted-foreground">{draft.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Event</div>
            <div className="mt-1 font-semibold">
              {new Date(draft.eventDate).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="my-4 h-px bg-border" />

        <div className="space-y-3">
          {draft.lines.map((l) => (
            <div key={l.id} className="flex items-baseline justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.name}</div>
                <div className="text-xs text-muted-foreground">
                  {l.qty} × Rs {l.rate} {l.unit !== "fixed" ? `(${l.unit})` : ""}
                </div>
              </div>
              <div className="font-semibold">Rs {l.qty * l.rate}</div>
            </div>
          ))}
        </div>

        <div className="my-4 h-px bg-border" />

        <Row label="Subtotal" value={`Rs ${subtotal}`} />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Discount</span>
          <input
            inputMode="numeric"
            value={draft.discount || ""}
            onChange={(e) => onDiscount(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
            placeholder="0"
            className="w-24 rounded-lg bg-secondary px-3 py-1.5 text-right text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-2xl font-extrabold">Rs {total}</span>
        </div>
      </div>

      <StickyCTA label="Generate & Save PDF" onClick={onConfirm} />
    </StepShell>
  );
}

/* ---------- Shared UI ---------- */

function StepShell({
  step,
  total,
  title,
  subtitle,
  children,
  onBack,
}: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft /> Back
      </button>
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Step {step} of {total}
        </div>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-full bg-secondary">
      <button
        onClick={() => onChange(value - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-secondary-foreground hover:bg-accent"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-bold">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-secondary-foreground hover:bg-accent"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StickyCTA({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/85 px-5 py-4 backdrop-blur-md">
      <div className="mx-auto w-full max-w-xl">
        <button
          onClick={onClick}
          disabled={disabled}
          className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-pop transition active:scale-[0.99] disabled:opacity-40"
        >
          {label}
        </button>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}
function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

/* ---------- helpers ---------- */

function emptyInvoice(): Invoice {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
    customerName: "",
    eventDate: new Date().toISOString().slice(0, 10),
    phone: "",
    lines: [],
    discount: 0,
    total: 0,
    createdAt: new Date().toISOString(),
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRelative(date: Date) {
  const today = startOfToday();
  const diff = Math.round((+date - +today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
