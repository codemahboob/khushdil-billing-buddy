import jsPDF from "jspdf";
import type { Invoice } from "./invoice-storage";

export function generateInvoicePDF(inv: Invoice) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Khushdil Tent & DJ", 48, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Event Services • Invoice", 48, y + 16);

  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Invoice #${inv.id.slice(0, 8).toUpperCase()}`, W - 48, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(new Date(inv.createdAt).toLocaleDateString(), W - 48, y + 16, { align: "right" });

  y += 50;
  doc.setDrawColor(220);
  doc.line(48, y, W - 48, y);

  // Bill to
  y += 28;
  doc.setTextColor(120);
  doc.setFontSize(9);
  doc.text("BILL TO", 48, y);
  doc.text("EVENT DATE", W / 2, y);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(inv.customerName || "Customer", 48, y + 18);
  doc.text(new Date(inv.eventDate).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" }), W / 2, y + 18);
  if (inv.phone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(inv.phone, 48, y + 34);
  }

  // Table header
  y += 64;
  doc.setFillColor(245, 247, 245);
  doc.rect(48, y - 14, W - 96, 24, "F");
  doc.setTextColor(80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SERVICE", 60, y);
  doc.text("QTY", W - 240, y, { align: "right" });
  doc.text("RATE", W - 160, y, { align: "right" });
  doc.text("AMOUNT", W - 60, y, { align: "right" });

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20);

  inv.lines.forEach((l) => {
    const amount = l.rate * l.qty;
    doc.text(l.name, 60, y);
    doc.setTextColor(120);
    doc.setFontSize(9);
    doc.text(l.unit, 60, y + 12);
    doc.setTextColor(20);
    doc.setFontSize(11);
    doc.text(String(l.qty), W - 240, y, { align: "right" });
    doc.text(`Rs ${l.rate}`, W - 160, y, { align: "right" });
    doc.text(`Rs ${amount}`, W - 60, y, { align: "right" });
    y += 28;
    doc.setDrawColor(235);
    doc.line(48, y - 8, W - 48, y - 8);
  });

  // Totals
  const subtotal = inv.lines.reduce((s, l) => s + l.rate * l.qty, 0);
  y += 16;
  doc.setTextColor(120);
  doc.setFontSize(10);
  doc.text("Subtotal", W - 160, y, { align: "right" });
  doc.setTextColor(20);
  doc.text(`Rs ${subtotal}`, W - 60, y, { align: "right" });

  if (inv.discount > 0) {
    y += 18;
    doc.setTextColor(120);
    doc.text("Discount", W - 160, y, { align: "right" });
    doc.setTextColor(20);
    doc.text(`- Rs ${inv.discount}`, W - 60, y, { align: "right" });
  }

  y += 24;
  doc.setDrawColor(20);
  doc.line(W - 240, y - 12, W - 48, y - 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", W - 160, y, { align: "right" });
  doc.text(`Rs ${inv.total}`, W - 60, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text("Thank you for choosing Khushdil Tent & DJ.", 48, 800);

  const safeName = inv.customerName.replace(/[^a-z0-9]/gi, "_") || "invoice";
  doc.save(`Khushdil_${safeName}_${inv.id.slice(0, 6)}.pdf`);
}
