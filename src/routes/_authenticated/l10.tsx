import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap, BookOpenCheck, Wrench, Handshake, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { LevelHeader } from "@/components/level-header";
import { Button } from "@/components/ui/button";
import {
  getKernelStatus,
  listHypotheses,
  listRecentLogs,
  listRecentMetrics,
  listTasks,
  listTransformations,
  runCognitiveCycle,
} from "@/lib/api";
import { useRealtimeQuery } from "@/hooks/use-realtime";

export const Route = createFileRoute("/_authenticated/l10")({
  head: () => ({
    meta: [
      { title: "MALEKA Ω · L10 Supreme Orchestrator" },
      { name: "description", content: "Global sovereign command overview with unified logs and Cognitive Cycle." },
    ],
  }),
  component: L10Page,
});

function L10Page() {
  const qc = useQueryClient();
  useRealtimeQuery("logs", ["logs"]);
  useRealtimeQuery("metrics", ["metrics"]);

  const kernel = useQuery({ queryKey: ["kernel-status"], queryFn: getKernelStatus, refetchInterval: 5000 });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  const hyps = useQuery({ queryKey: ["hypotheses"], queryFn: listHypotheses });
  const trans = useQuery({ queryKey: ["transformations"], queryFn: listTransformations });
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => listRecentMetrics(20) });
  const logs = useQuery({ queryKey: ["logs"], queryFn: () => listRecentLogs(40) });

  const cycle = useMutation({
    mutationFn: runCognitiveCycle,
    onSuccess: (r) => {
      toast.success("Cognitive cycle complete", {
        description: `CCI ${r.metric.cci.toFixed(3)} · ${r.duration_ms}ms`,
      });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["kernel-status"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const latest = metrics.data?.[metrics.data.length - 1];

  return (
    <div>
      <LevelHeader
        level="L10 · Supreme"
        title="Supreme Orchestrator"
        subtitle="Global state of the MALEKA Ω civilization."
        icon={Crown}
        actions={
          <Button
            size="lg"
            onClick={() => cycle.mutate()}
            disabled={cycle.isPending}
            className="relative gap-2 overflow-hidden bg-gradient-to-r from-cyber-cyan to-cyber-violet text-primary-foreground hover:opacity-95 ring-cyber"
          >
            <AnimatePresence>
              {cycle.isPending && (
                <motion.span
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 left-0 w-1/3 bg-white/20 blur-md"
                />
              )}
            </AnimatePresence>
            <Zap className="h-4 w-4" />
            {cycle.isPending ? "Cycling…" : "Run Cognitive Cycle"}
          </Button>
        }
      />

      <div className="grid gap-4 p-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Stat label="Sovereignty" value={kernel.data?.sovereignty_index.toFixed(3) ?? "—"} hint="Index" />
            <Stat label="CCI" value={latest?.cci.toFixed(3) ?? "—"} hint="Coherence" />
            <Stat label="Stability" value={latest?.stability.toFixed(3) ?? "—"} hint="System" />
            <Stat
              label="Black Swan"
              value={((latest?.black_swan ?? 0) * 100).toFixed(1) + "%"}
              hint="Risk"
              accent={latest && latest.black_swan > 0.3 ? "rose-400" : "cyber-cyan"}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <LinkCard to="/l6" icon={Handshake} label="L6 Diplomacy" count={tasks.data?.length ?? 0} suffix="tasks" />
            <LinkCard
              to="/l7"
              icon={BookOpenCheck}
              label="L7 Knowledge"
              count={hyps.data?.length ?? 0}
              suffix="hypotheses"
            />
            <LinkCard
              to="/l8"
              icon={Wrench}
              label="L8 Reality Ledger"
              count={trans.data?.length ?? 0}
              suffix="blocks"
            />
            <LinkCard
              to="/l9"
              icon={ShieldAlert}
              label="L9 Sentinel"
              count={metrics.data?.length ?? 0}
              suffix="snapshots"
            />
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="mb-3 text-sm font-semibold tracking-tight">Identity kernel</h3>
            <div className="grid gap-2 text-xs">
              <KV k="Mode" v={kernel.data?.mode ?? "—"} mono />
              <KV
                k="Last cycle"
                v={kernel.data?.last_cycle_at ? new Date(kernel.data.last_cycle_at).toLocaleString() : "never"}
              />
              <KV k="Uptime" v={`${kernel.data?.uptime_seconds ?? 0}s`} mono />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="mb-3 text-sm font-semibold tracking-tight">Unified stream</h3>
          <div className="max-h-[640px] space-y-1 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {(logs.data ?? []).map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 font-mono text-[11px]"
                >
                  <span
                    className={
                      "mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full " +
                      (l.level === "error"
                        ? "bg-rose-400"
                        : l.level === "warn"
                          ? "bg-amber-400"
                          : l.level === "success"
                            ? "bg-emerald-400"
                            : "bg-cyber-cyan")
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{l.message}</div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{l.source}</span>
                      <span>{new Date(l.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(logs.data ?? []).length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No events yet. Run a cycle.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WebXR foundation: when WebXR session is available, spatial dashboards can mount here.
         Plan: mount a Three.js (or react-three-fiber) scene that mirrors these widgets in 3D,
         using XRSessionMode 'immersive-ar' and DOM-overlay for legibility. */}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent = "cyber-cyan",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight text-${accent}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function LinkCard({
  to,
  icon: Icon,
  label,
  count,
  suffix,
}: {
  to: "/l6" | "/l7" | "/l8" | "/l9";
  icon: typeof Crown;
  label: string;
  count: number;
  suffix: string;
}) {
  return (
    <Link
      to={to}
      className="group glass flex items-center justify-between rounded-2xl p-4 transition-all duration-300 hover:border-cyber-cyan/40 hover:ring-cyber"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyber-cyan" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold">{count}</div>
        <div className="text-[10px] text-muted-foreground">{suffix}</div>
      </div>
    </Link>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={mono ? "font-mono" : ""}>{v}</span>
    </div>
  );
}
