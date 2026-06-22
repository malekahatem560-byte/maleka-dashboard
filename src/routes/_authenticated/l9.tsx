import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldAlert, Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LevelHeader } from "@/components/level-header";
import { listRecentLogs, listRecentMetrics } from "@/lib/api";
import { useRealtimeQuery } from "@/hooks/use-realtime";

export const Route = createFileRoute("/_authenticated/l9")({
  head: () => ({
    meta: [
      { title: "MALEKA Ω · L9 Autonomous Sentinel" },
      { name: "description", content: "Live CCI, stability, risk profile, and Black Swan alerts." },
    ],
  }),
  component: L9Page,
});

function L9Page() {
  useRealtimeQuery("metrics", ["metrics"]);
  useRealtimeQuery("logs", ["logs"]);

  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => listRecentMetrics(60) });
  const logs = useQuery({ queryKey: ["logs"], queryFn: () => listRecentLogs(60) });

  const latest = metrics.data?.[metrics.data.length - 1];
  const chartData = (metrics.data ?? []).map((m) => ({
    t: new Date(m.recorded_at).toLocaleTimeString(),
    cci: Number(m.cci),
    stability: Number(m.stability),
    risk: Number(m.risk_profile),
    black_swan: Number(m.black_swan),
  }));

  return (
    <div>
      <LevelHeader
        level="L9 · Sentinel"
        title="Autonomous Sentinel"
        subtitle="Live metrics, Black Swan risk, and violation stream."
        icon={ShieldAlert}
      />

      <div className="grid gap-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="CCI" value={latest?.cci} accent="cyber-cyan" />
          <MetricCard label="Stability" value={latest?.stability} accent="emerald-400" />
          <MetricCard label="Risk profile" value={latest?.risk_profile} accent="amber-300" invert />
          <BlackSwanGauge value={latest?.black_swan ?? 0} />
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Activity className="h-4 w-4 text-cyber-cyan" /> Metrics over time
          </h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g-cci" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-risk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.24 30)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.7 0.24 30)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "oklch(0.6 0.04 250)" }} hide />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.6 0.04 250)" }} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.14 0.03 270)",
                    border: "1px solid oklch(0.22 0.04 265 / 0.6)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Area type="monotone" dataKey="cci" stroke="oklch(0.78 0.18 200)" fill="url(#g-cci)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="risk" stroke="oklch(0.7 0.24 30)" fill="url(#g-risk)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="stability" stroke="oklch(0.7 0.18 150)" fill="transparent" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="mb-3 text-sm font-semibold tracking-tight">Sentinel stream</h3>
          <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
            {(logs.data ?? []).map((l) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 font-mono text-[11px]"
              >
                <span
                  className={
                    "mt-0.5 inline-block h-1.5 w-1.5 rounded-full " +
                    (l.level === "error"
                      ? "bg-rose-400"
                      : l.level === "warn"
                        ? "bg-amber-400"
                        : l.level === "success"
                          ? "bg-emerald-400"
                          : "bg-cyber-cyan")
                  }
                />
                <span className="w-24 truncate text-muted-foreground">{l.source}</span>
                <span className="flex-1">{l.message}</span>
                <span className="text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</span>
              </motion.div>
            ))}
            {(logs.data ?? []).length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">Sentinel idle.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  invert,
}: {
  label: string;
  value: number | undefined;
  accent: string;
  invert?: boolean;
}) {
  const v = Number(value ?? 0);
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tracking-tight text-${accent}`}>
        {v.toFixed(3)}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full bg-${accent}`}
          initial={{ width: 0 }}
          animate={{ width: `${(invert ? 1 - v : v) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function BlackSwanGauge({ value }: { value: number }) {
  const pct = Math.min(1, Math.max(0, value));
  const color = pct > 0.4 ? "rose-400" : pct > 0.2 ? "amber-300" : "emerald-400";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Black Swan</div>
      <div className={`mt-1 text-3xl font-semibold tracking-tight text-${color}`}>
        {(pct * 100).toFixed(1)}%
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full bg-${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">
        {pct > 0.4 ? "Critical anomaly threshold" : pct > 0.2 ? "Elevated" : "Nominal"}
      </div>
    </div>
  );
}
