import {
  Agent,
  AgentStatus,
  Project,
  SystemSnapshot,
} from "@/types/maleka-core";
import { MALEKA_CONFIG, SEED_AGENTS, SEED_PROJECTS } from "@/config/maleka";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const maybeFail = () => {
  if (Math.random() < MALEKA_CONFIG.failureRate) {
    throw new Error("Upstream cognitive service unavailable");
  }
};

export async function getSystemData(): Promise<SystemSnapshot> {
  await wait(MALEKA_CONFIG.apiLatencyMs);
  maybeFail();

  const agents: Agent[] = SEED_AGENTS.map((a, i) => ({
    id: a.id,
    name: a.name,
    task: a.task,
    status: (["Active", "Idle", "Processing"] as AgentStatus[])[i % 3],
    load: Math.round(20 + Math.random() * 70),
  }));

  const projects: Project[] = SEED_PROJECTS.map((p, i) => ({
    id: p.id,
    title: p.title,
    progress: [82, 41, 12][i] ?? 0,
    status: (["Processing", "Processing", "Draft"] as Project["status"][])[i],
  }));

  return {
    system: {
      sovereignty_index: 0.847,
      active_agents: agents.filter((a) => a.status === "Active").map((a) => a.id),
      system_health: 0.96,
      cpu_load: 0.42,
      kg_sync: 0.73,
    },
    agents,
    projects,
  };
}

export async function updateAgentStatus(
  agentId: string,
  status: AgentStatus,
): Promise<{ id: string; status: AgentStatus }> {
  await wait(MALEKA_CONFIG.agentMutateLatencyMs);
  maybeFail();
  return { id: agentId, status };
}

export async function runTransformationTask(
  projectId: string,
  onProgress: (progress: number) => void,
): Promise<Project> {
  const steps = 30;
  const stepMs = MALEKA_CONFIG.taskDurationMs / steps;
  for (let i = 1; i <= steps; i++) {
    await wait(stepMs);
    onProgress(Math.round((i / steps) * 100));
  }
  return {
    id: projectId,
    title: "",
    progress: 100,
    status: "Completed",
  };
}
