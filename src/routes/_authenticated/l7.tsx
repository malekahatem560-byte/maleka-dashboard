import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpenCheck, Plus, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { LevelHeader } from "@/components/level-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createHypothesis,
  listHypotheses,
  validateHypothesis,
  type HypothesisRow,
} from "@/lib/api";
import { useRealtimeQuery } from "@/hooks/use-realtime";

export const Route = createFileRoute("/_authenticated/l7")({
  head: () => ({
    meta: [
      { title: "MALEKA Ω · L7 Knowledge OS" },
      { name: "description", content: "Hypothesis registry, novelty scoring, and knowledge graph." },
    ],
  }),
  component: L7Page,
});

function L7Page() {
  useRealtimeQuery("hypotheses", ["hypotheses"]);
  const list = useQuery({ queryKey: ["hypotheses"], queryFn: listHypotheses });

  const { nodes, edges } = useMemo(() => buildGraph(list.data ?? []), [list.data]);

  return (
    <div>
      <LevelHeader
        level="L7 · Knowledge"
        title="Knowledge OS"
        subtitle="Hypotheses, novelty scoring, and the sovereign knowledge graph."
        icon={BookOpenCheck}
        actions={<NewHypothesisDialog />}
      />

      <div className="grid gap-4 p-6 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-2">
          <h3 className="text-sm font-semibold tracking-tight">Registry</h3>
          {(list.data ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              No hypotheses yet.
            </div>
          )}
          {(list.data ?? []).map((h) => (
            <HypothesisCard key={h.id} h={h} />
          ))}
        </div>

        <div className="xl:col-span-3">
          <h3 className="mb-3 text-sm font-semibold tracking-tight">Knowledge graph</h3>
          <div className="h-[560px] overflow-hidden rounded-2xl glass">
            <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
              <Background gap={20} color="oklch(0.4 0.06 270 / 0.4)" />
              <Controls className="!bg-card !border-border" />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}

function HypothesisCard({ h }: { h: HypothesisRow }) {
  const qc = useQueryClient();
  const validate = useMutation({
    mutationFn: (outcome: "Validated" | "Rejected") => validateHypothesis(h.id, outcome),
    onSuccess: ({ proof }) => {
      toast.success("ProofArtifact signed", { description: proof.signature.slice(0, 32) + "…" });
      qc.invalidateQueries({ queryKey: ["hypotheses"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const novelty = Number(h.novelty_score);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass p-4"
    >
      <div className="text-sm">{h.statement}</div>
      {h.context && <p className="mt-1 text-xs text-muted-foreground">{h.context}</p>}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Novelty</span>
            <span>{(novelty * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-violet"
              initial={{ width: 0 }}
              animate={{ width: `${novelty * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider">
          {h.status}
        </span>
      </div>
      {h.status === "Draft" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => validate.mutate("Validated")}>
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Validate
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => validate.mutate("Rejected")}>
            <ShieldX className="mr-1 h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function NewHypothesisDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statement, setStatement] = useState("");
  const [context, setContext] = useState("");

  const create = useMutation({
    mutationFn: () => createHypothesis({ statement, context: context || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hypotheses"] });
      toast.success("Hypothesis filed");
      setOpen(false);
      setStatement("");
      setContext("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> File hypothesis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File new hypothesis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="State the hypothesis..."
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
          <Input placeholder="Context (optional)" value={context} onChange={(e) => setContext(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!statement || create.isPending}>
            {create.isPending ? "Filing…" : "File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildGraph(rows: HypothesisRow[]): { nodes: Node[]; edges: Edge[] } {
  const radius = 220;
  const nodes: Node[] = rows.map((h, i) => {
    const angle = (i / Math.max(rows.length, 1)) * Math.PI * 2;
    return {
      id: h.id,
      position: { x: Math.cos(angle) * radius + radius + 40, y: Math.sin(angle) * radius + radius + 40 },
      data: { label: h.statement.length > 40 ? h.statement.slice(0, 40) + "…" : h.statement },
      style: {
        background: "oklch(0.14 0.03 270)",
        color: "oklch(0.95 0.01 240)",
        border:
          h.status === "Validated"
            ? "1px solid oklch(0.78 0.18 200)"
            : h.status === "Rejected"
              ? "1px solid oklch(0.6 0.22 25)"
              : "1px solid oklch(0.3 0.04 270)",
        borderRadius: 12,
        padding: 8,
        fontSize: 11,
        width: 180,
      },
    };
  });
  const edges: Edge[] = rows
    .filter((h) => h.parent_id)
    .map((h) => ({
      id: `${h.parent_id}-${h.id}`,
      source: h.parent_id!,
      target: h.id,
      animated: true,
      style: { stroke: "oklch(0.78 0.18 200 / 0.6)" },
    }));
  return { nodes, edges };
}
