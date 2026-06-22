import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  listTasks,
  listHypotheses,
  listTransformations,
  listRecentMetrics,
  listRecentLogs,
  getKernelStatus,
} from "@/lib/api";

export async function buildSystemSnapshot() {
  const [kernel, tasks, hypotheses, transformations, metrics, logs] = await Promise.all([
    getKernelStatus(),
    listTasks(),
    listHypotheses(),
    listTransformations(),
    listRecentMetrics(60),
    listRecentLogs(200),
  ]);
  return {
    generated_at: new Date().toISOString(),
    kernel,
    tasks,
    hypotheses,
    transformations,
    metrics,
    logs,
  };
}

export async function exportJSON() {
  const snapshot = await buildSystemSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `maleka-omega-snapshot-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF() {
  const s = await buildSystemSnapshot();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(22);
  doc.text("MALEKA Ω · System Report", 40, 56);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${s.generated_at}`, 40, 74);
  doc.text(`Sovereignty Index ${s.kernel.sovereignty_index.toFixed(3)}`, 40, 88);

  autoTable(doc, {
    startY: 110,
    head: [["Tasks", "Status", "Priority"]],
    body: s.tasks.slice(0, 20).map((t) => [t.title, t.status, t.priority]),
    theme: "grid",
    headStyles: { fillColor: [20, 24, 48] },
  });
  autoTable(doc, {
    head: [["Hypothesis", "Novelty", "Status"]],
    body: s.hypotheses
      .slice(0, 20)
      .map((h) => [h.statement, (Number(h.novelty_score) * 100).toFixed(1) + "%", h.status]),
    theme: "grid",
    headStyles: { fillColor: [20, 24, 48] },
  });
  autoTable(doc, {
    head: [["Block", "Title", "Hash", "Status"]],
    body: s.transformations
      .slice(0, 20)
      .map((t) => [String(t.block_index), t.title, t.hash.slice(0, 16) + "…", t.status]),
    theme: "grid",
    headStyles: { fillColor: [20, 24, 48] },
  });

  doc.save(`maleka-omega-report-${Date.now()}.pdf`);
}
