/**
 * MALEKA Ω API client.
 *
 * Models the Rust kernel HTTP surface (`/api/kernel/status`, `/api/tasks`,
 * `/api/hypotheses`, `/api/transformations`, `/api/cycle`) but is currently
 * backed by Lovable Cloud. When the real Rust backend is deployed, flip
 * `API_MODE` to "rust" and set `VITE_MALEKA_API_URL`; call sites stay the same.
 *
 * Every critical action returns a simulated ProofArtifact (sha-256 over the payload).
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { chainHash, signProof, type ProofArtifact } from "@/lib/proof";

type ApiMode = "supabase" | "rust";
const API_MODE: ApiMode = "supabase";
export const API_BASE_URL =
  (import.meta.env.VITE_MALEKA_API_URL as string | undefined) ?? "";

export class SentinelError extends Error {
  level: "warn" | "error" | "critical";
  constructor(message: string, level: "warn" | "error" | "critical" = "error") {
    super(`[SENTINEL] ${message}`);
    this.level = level;
  }
}

async function logEvent(
  level: "info" | "warn" | "error" | "success" | "debug",
  source: string,
  message: string,
  meta: Record<string, unknown> = {},
) {
  try {
    await supabase.from("logs").insert({ level, source, message, meta: meta as Json });
  } catch {
    // logs are best-effort
  }
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new SentinelError(result.error.message);
  if (result.data === null) throw new SentinelError("Empty response from kernel");
  return result.data;
}

// ===== KERNEL =====
export interface KernelStatus {
  identity_verified: boolean;
  sovereignty_index: number;
  uptime_seconds: number;
  last_cycle_at: string | null;
  mode: ApiMode;
}

export async function getKernelStatus(): Promise<KernelStatus> {
  const { data: metrics } = await supabase
    .from("metrics")
    .select("cci")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: lastLog } = await supabase
    .from("logs")
    .select("created_at")
    .eq("source", "kernel:cycle")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    identity_verified: true,
    sovereignty_index: Number(metrics?.cci ?? 0.847),
    uptime_seconds: Math.floor(performance.now() / 1000),
    last_cycle_at: lastLog?.created_at ?? null,
    mode: API_MODE,
  };
}

// ===== TASKS (L6) =====
export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "Pending" | "InProgress" | "Completed" | "Failed";
  priority: "Low" | "Medium" | "High" | "Critical";
  owner_id: string;
  federation_node: string | null;
  created_at: string;
  updated_at: string;
};

export async function listTasks(): Promise<TaskRow[]> {
  const res = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  return unwrap(res) as TaskRow[];
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: TaskRow["priority"];
  federation_node?: string;
}): Promise<TaskRow> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new SentinelError("No identity kernel attached", "critical");
  const res = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      priority: input.priority ?? "Medium",
      federation_node: input.federation_node,
      owner_id: user.id,
    })
    .select()
    .single();
  const row = unwrap(res) as TaskRow;
  void logEvent("info", "L6:task", `Task created · ${input.title}`);
  return row;
}

export async function updateTaskStatus(id: string, status: TaskRow["status"]): Promise<void> {
  const res = await supabase.from("tasks").update({ status }).eq("id", id);
  if (res.error) throw new SentinelError(res.error.message);
  void logEvent("info", "L6:task", `Task ${id.slice(0, 8)} → ${status}`);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new SentinelError(error.message);
}

// ===== HYPOTHESES (L7) =====
export type HypothesisRow = {
  id: string;
  statement: string;
  context: string | null;
  novelty_score: number;
  status: "Draft" | "Validated" | "Rejected";
  parent_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export async function listHypotheses(): Promise<HypothesisRow[]> {
  const res = await supabase.from("hypotheses").select("*").order("created_at", { ascending: false });
  return unwrap(res) as HypothesisRow[];
}

export async function createHypothesis(input: {
  statement: string;
  context?: string;
  parent_id?: string;
}): Promise<HypothesisRow> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new SentinelError("No identity kernel attached", "critical");
  const novelty = Math.min(1, Math.max(0.1, new Set(input.statement.toLowerCase()).size / 32));
  const res = await supabase
    .from("hypotheses")
    .insert({
      statement: input.statement,
      context: input.context,
      parent_id: input.parent_id,
      novelty_score: Number(novelty.toFixed(4)),
      owner_id: user.id,
    })
    .select()
    .single();
  const row = unwrap(res) as HypothesisRow;
  void logEvent("info", "L7:hypothesis", `Hypothesis filed · novelty ${(novelty * 100).toFixed(1)}%`);
  return row;
}

export async function validateHypothesis(
  id: string,
  outcome: "Validated" | "Rejected",
): Promise<{ row: HypothesisRow; proof: ProofArtifact }> {
  const res = await supabase.from("hypotheses").update({ status: outcome }).eq("id", id).select().single();
  const row = unwrap(res) as HypothesisRow;
  const proof = await signProof({ id, outcome, ts: Date.now() });
  void logEvent("success", "L7:hypothesis", `Hypothesis ${id.slice(0, 8)} → ${outcome}`, { proof });
  return { row, proof };
}

// ===== TRANSFORMATIONS (L8) =====
export type TransformationRow = {
  id: string;
  block_index: number;
  title: string;
  payload: Record<string, unknown>;
  prev_hash: string | null;
  hash: string;
  proof_artifact: string | null;
  status: "Pending" | "Signed" | "Committed" | "Reverted";
  owner_id: string;
  created_at: string;
};

export async function listTransformations(): Promise<TransformationRow[]> {
  const res = await supabase
    .from("transformations")
    .select("*")
    .order("block_index", { ascending: false });
  return unwrap(res) as unknown as TransformationRow[];
}

export async function createTransformation(input: {
  title: string;
  payload: Record<string, unknown>;
}): Promise<TransformationRow> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new SentinelError("No identity kernel attached", "critical");
  const { data: prev } = await supabase
    .from("transformations")
    .select("hash")
    .order("block_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const hash = await chainHash(prev?.hash ?? null, input.payload);
  const proof = await signProof({ ...input.payload, hash });
  const res = await supabase
    .from("transformations")
    .insert({
      title: input.title,
      payload: input.payload as Json,
      prev_hash: prev?.hash ?? null,
      hash,
      proof_artifact: proof.signature,
      status: "Signed",
      owner_id: user.id,
    })
    .select()
    .single();
  const row = unwrap(res) as unknown as TransformationRow;
  void logEvent("success", "L8:transform", `RealityBlock #${row.block_index} signed`);
  return row;
}

// ===== METRICS (L9) =====
export type MetricRow = {
  id: string;
  cci: number;
  stability: number;
  risk_profile: number;
  black_swan: number;
  meta: Record<string, unknown>;
  recorded_at: string;
};

export async function listRecentMetrics(limit = 60): Promise<MetricRow[]> {
  const res = await supabase
    .from("metrics")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(limit);
  const rows = unwrap(res) as unknown as MetricRow[];
  return rows.slice().reverse();
}

// ===== LOGS =====
export type LogRow = {
  id: string;
  level: "info" | "warn" | "error" | "success" | "debug";
  source: string;
  message: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export async function listRecentLogs(limit = 100): Promise<LogRow[]> {
  const res = await supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return unwrap(res) as unknown as LogRow[];
}

// ===== COGNITIVE CYCLE =====
export interface CycleResult {
  ok: true;
  duration_ms: number;
  metric: MetricRow;
  proof: ProofArtifact;
}

export async function runCognitiveCycle(): Promise<CycleResult> {
  const t0 = performance.now();
  void logEvent("info", "kernel:cycle", "Cognitive cycle initiated");

  await new Promise((r) => setTimeout(r, 1400));

  const { data: tasks } = await supabase.from("tasks").select("status");
  const { data: hyps } = await supabase.from("hypotheses").select("status, novelty_score");

  const completion = tasks?.length
    ? tasks.filter((t) => t.status === "Completed").length / tasks.length
    : 0.5;
  const noveltyAvg = hyps?.length
    ? hyps.reduce((s, h) => s + Number(h.novelty_score), 0) / hyps.length
    : 0.4;
  const validated = hyps?.filter((h) => h.status === "Validated").length ?? 0;

  const cci = Math.min(1, 0.55 + completion * 0.25 + noveltyAvg * 0.2);
  const stability = Math.min(1, 0.7 + Math.random() * 0.25);
  const risk_profile = Math.max(0, 0.4 - validated * 0.02 + Math.random() * 0.15);
  const black_swan = Math.max(0, Math.random() * 0.12 + (risk_profile > 0.5 ? 0.1 : 0));

  const res = await supabase
    .from("metrics")
    .insert({
      cci,
      stability,
      risk_profile,
      black_swan,
      meta: { source: "cycle" } as Json,
    })
    .select()
    .single();
  const metric = unwrap(res) as unknown as MetricRow;

  const proof = await signProof({ cci, stability, risk_profile, black_swan });
  const duration_ms = Math.round(performance.now() - t0);
  void logEvent(
    "success",
    "kernel:cycle",
    `Cognitive cycle complete (${duration_ms}ms) · CCI ${cci.toFixed(3)}`,
    { proof },
  );
  return { ok: true, duration_ms, metric, proof };
}
