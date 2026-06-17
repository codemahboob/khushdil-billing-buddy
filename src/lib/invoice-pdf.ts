import jsPDF from "jspdf";
import type { Invoice } from "./invoice-storage";
import { formatInvoiceNo } from "./invoice-storage";
import { BUSINESS } from "./business";

function buildInvoiceDoc(inv: Invoice) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 56;
  const R = W - 56;

  const issued = new Date(inv.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ---- Top-left meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text(issued, L, 90);

  doc.text("Invoice No", L + 140, 90);
  doc.text(formatInvoiceNo(inv.invoiceNo).replace("#", ""), L + 140, 104);

  // ---- Big display brand (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(46);
  doc.setTextColor(15);
  const brandWords = BUSINESS.name.split(" & ");
  // Render line-broken display name on the right
  const lines = ["Khushdil", "Tent & DJ"];
  let by = 96;
  lines.forEach((ln) => {
    doc.text(ln, R, by, { align: "right" });
    by += 44;
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Proprietor — ${BUSINESS.proprietor}`, R, by - 6, { align: "right" });
  void brandWords;

  // ---- Invoice To block
  let y = 230;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("Invoice to :", R, y, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15);
  doc.text((inv.customerName || "Customer").toUpperCase(), R, y + 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  if (inv.address) {
    doc.text(inv.address, R, y + 36, { align: "right" });
  }
  if (inv.phone) {
    doc.text(`Phone: ${inv.phone}`, R, y + (inv.address ? 50 : 36), { align: "right" });
  }
  doc.setTextColor(80);
  doc.text(
    `Event: ${new Date(inv.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    R,
    y + (inv.address ? 64 : 50),
    { align: "right" },
  );

  // ---- Items table
  y = 340;
  doc.setDrawColor(40);
  doc.setLineWidth(0.8);
  doc.line(L, y, R, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20);
  const colQty = L + 250;
  const colPrice = L + 340;
  const colSub = R;
  doc.text("ITEM DESCRIPTION", L, y - 8);
  doc.text("QTY", colQty, y - 8);
  doc.text("PRICE", colPrice, y - 8);
  doc.text("SUB TOTAL", colSub, y - 8, { align: "right" });

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  inv.lines.forEach((l) => {
    const amount = l.rate * l.qty;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15);
    doc.setFontSize(11);
    doc.text(l.name, L, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    const desc = l.description || l.unit;
    const wrapped = doc.splitTextToSize(desc, 200);
    doc.text(wrapped, L, y + 12);

    doc.setTextColor(30);
    doc.setFontSize(10);
    doc.text(String(l.qty), colQty, y);
    doc.text(`Rs ${l.rate}`, colPrice, y);
    doc.text(`Rs ${amount}`, colSub, y, { align: "right" });

    const rowH = 18 + wrapped.length * 11;
    y += rowH + 8;
    doc.setDrawColor(225);
    doc.setLineWidth(0.5);
    doc.line(L, y - 6, R, y - 6);
  });

  // Bottom border of table
  y += 4;
  doc.setDrawColor(40);
  doc.setLineWidth(0.8);
  doc.line(L, y, R, y);

  // ---- Totals + terms
  y += 30;
  const subtotal = inv.lines.reduce((s, l) => s + l.rate * l.qty, 0);
  const totalsX = colPrice;

  // Terms (left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15);
  doc.text("Term and Conditions :", L, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(doc.splitTextToSize(BUSINESS.terms, 220), L, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15);
  doc.text("Contact :", L, y + 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(BUSINESS.phones.join(" / "), L, y + 74);

  // Totals (right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("SUB TOTAL", totalsX, y);
  doc.setTextColor(15);
  doc.text(`Rs ${subtotal}`, colSub, y, { align: "right" });

  doc.setTextColor(80);
  doc.text(inv.discount > 0 ? "DISCOUNT" : "TAXES", totalsX, y + 22);
  doc.setTextColor(15);
  doc.text(
    inv.discount > 0 ? `- Rs ${inv.discount}` : `Rs ${inv.tax || 0}`,
    colSub,
    y + 22,
    { align: "right" },
  );

  y += 50;
  doc.setDrawColor(220);
  doc.line(totalsX - 10, y - 8, R, y - 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15);
  doc.text("TOTAL", totalsX, y);
  doc.text(`Rs ${inv.total}`, colSub, y, { align: "right" });

  // ---- Footer
  const fy = H - 90;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15);
  doc.text(`${BUSINESS.name}`, L, fy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`P. ${BUSINESS.phones.join(", ")}`, L, fy + 16);
  doc.text(`A. ${BUSINESS.address}`, L, fy + 30);
  doc.text(`Proprietor: ${BUSINESS.proprietor}`, L, fy + 44);

  return doc;
}

function invoiceFilename(inv: Invoice) {
  const safeName = (inv.customerName || "invoice").replace(/[^a-z0-9]/gi, "_");
  return `KTD${inv.invoiceNo}_${safeName}.pdf`;
}

export function generateInvoicePDF(inv: Invoice) {
  const doc = buildInvoiceDoc(inv);
  const filename = invoiceFilename(inv);
  try {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    doc.save(filename);
  }
}

export async function shareInvoicePDF(inv: Invoice): Promise<"shared" | "downloaded" | "unsupported"> {
  const doc = buildInvoiceDoc(inv);
  const safeName = (inv.customerName || "invoice").replace(/[^a-z0-9]/gi, "_");
  const filename = `KTD${inv.invoiceNo}_${safeName}.pdf`;
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: ShareData & { files?: File[] }) => Promise<void> };
  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: filename, text: `Invoice ${formatInvoiceNo(inv.invoiceNo)}` });
      return "shared";
    } catch {
      return "unsupported";
    }
  }
  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return "downloaded";
}
