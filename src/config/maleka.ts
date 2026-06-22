export const MALEKA_CONFIG = {
  apiLatencyMs: 500,
  agentMutateLatencyMs: 300,
  taskDurationMs: 6000,
  tickIntervalMs: 1500,
  historyLength: 60,
  failureRate: 0.0,
} as const;

export const SEED_AGENTS = [
  { id: "atlas", name: "Atlas", task: "Knowledge graph synthesis" },
  { id: "nyx", name: "Nyx", task: "Anomaly detection" },
  { id: "vega", name: "Vega", task: "Vector retrieval" },
  { id: "orion", name: "Orion", task: "Reasoning chain audit" },
  { id: "lyra", name: "Lyra", task: "Multimodal alignment" },
  { id: "kairos", name: "Kairos", task: "Temporal sequencing" },
] as const;

export const SEED_PROJECTS = [
  { id: "p-001", title: "Cognitive OS · v0.9 transformation" },
  { id: "p-002", title: "Sovereign reasoning corpus" },
  { id: "p-003", title: "Knowledge graph consolidation" },
] as const;
