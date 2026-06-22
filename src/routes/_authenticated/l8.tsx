import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wrench, Plus, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { LevelHeader } from "@/components/level-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTransformation, listTransformations } from "@/lib/api";
import { useRealtimeQuery } from "@/hooks/use-realtime";

export const Route = createFileRoute("/_authenticated/l8")({
  head: () => ({
    meta: [
      { title: "MALEKA Ω · L8 Creator Engineering" },
      { name: "description", content: "RealityBlock ledger with chained hashes and proof artifacts." },
    ],
  }),
  component: L8Page,
});

function L8Page() {
  useRealtimeQuery("transformations", ["transformations"]);
  const list = useQuery({ queryKey: ["transformations"], queryFn: listTransformations });
  const items = list.data ?? [];

  return (
    <div>
      <LevelHeader
        level="L8 · Creator"
        title="Reality Ledger"
        subtitle="Append-only chain of signed RealityBlocks."
        icon={Wrench}
        actions={<NewTransformationDialog />}
      />

      <div className="p-6">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            The ledger is empty. Forge the genesis block.
          </div>
        )}

        <ol className="relative space-y-4 border-l border-border/60 pl-6">
          {items.map((t, i) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative"
            >
              <span className="absolute -left-[31px] top-3 flex h-4 w-4 items-center justify-center rounded-full bg-cyber-cyan/20 ring-2 ring-cyber-cyan/40">
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan" />
              </span>
              <div className="glass rounded-xl p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Block #{t.block_index} · {new Date(t.created_at).toLocaleString()}
                    </div>
                    <h3 className="text-sm font-medium">{t.title}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/10 px-2 py-0.5 text-[10px] text-cyber-cyan">
                    <ShieldCheck className="h-3 w-3" /> {t.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-[11px] font-mono text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">hash {t.hash.slice(0, 24)}…</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <LinkIcon className="h-3 w-3 shrink-0 opacity-50" />
                    <span className="truncate">prev {t.prev_hash ? t.prev_hash.slice(0, 24) + "…" : "GENESIS"}</span>
                  </div>
                </div>
                {t.proof_artifact && (
                  <div className="mt-2 truncate font-mono text-[10px] text-cyber-cyan/70">
                    proof {t.proof_artifact.slice(0, 48)}…
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function NewTransformationDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState('{"action":"refactor","scope":"kernel"}');

  const create = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(payload) as Record<string, unknown>;
      } catch {
        throw new Error("Payload must be valid JSON");
      }
      return createTransformation({ title, payload: parsed });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transformations"] });
      toast.success("RealityBlock signed");
      setOpen(false);
      setTitle("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Forge block
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forge RealityBlock</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            className="font-mono text-xs"
            rows={6}
            placeholder="JSON payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!title || create.isPending}>
            {create.isPending ? "Signing…" : "Sign & commit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
