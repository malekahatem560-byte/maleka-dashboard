import { create } from "zustand";
import {
  Agent,
  AgentStatus,
  LogEntry,
  Project,
  SystemState,
} from "@/types/maleka-core";
import {
  getSystemData,
  runTransformationTask,
  updateAgentStatus,
} from "@/services/api-service";

type Status = "idle" | "loading" | "ready" | "error";

interface SystemStore {
  status: Status;
  error: string | null;
  system: SystemState | null;
  agents: Agent[];
  projects: Project[];
  logs: LogEntry[];
  cpuHistory: number[];
  kgHistory: number[];

  bootstrap: () => Promise<void>;
  cycleAgent: (id: string) => Promise<void>;
  runTask: (id: string) => Promise<void>;
  pushLog: (entry: Omit<LogEntry, "id" | "ts">) => void;
  tick: () => void;
}

const nextStatus = (s: AgentStatus): AgentStatus =>
  s === "Idle" ? "Active" : s === "Active" ? "Processing" : "Idle";

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export const useSystemStore = create<SystemStore>((set, get) => ({
  status: "idle",
  error: null,
  system: null,
  agents: [],
  projects: [],
  logs: [],
  cpuHistory: [],
  kgHistory: [],

  bootstrap: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const data = await getSystemData();
      set({
        status: "ready",
        system: data.system,
        agents: data.agents,
        projects: data.projects,
        cpuHistory: Array.from({ length: 30 }, () => data.system.cpu_load),
        kgHistory: Array.from({ length: 30 }, () => data.system.kg_sync),
      });
      get().pushLog({
        level: "success",
        source: "core",
        message: "Cognitive OS online · sovereignty index nominal",
      });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  cycleAgent: async (id) => {
    const agent = get().agents.find((a) => a.id === id);
    if (!agent) return;
    const target = nextStatus(agent.status);
    set({
      agents: get().agents.map((a) =>
        a.id === id ? { ...a, status: target } : a,
      ),
    });
    try {
      await updateAgentStatus(id, target);
      get().pushLog({
        level: "info",
        source: `agent:${agent.name}`,
        message: `Status → ${target}`,
      });
    } catch (e) {
      set({
        agents: get().agents.map((a) =>
          a.id === id ? { ...a, status: agent.status } : a,
        ),
      });
      get().pushLog({
        level: "error",
        source: `agent:${agent.name}`,
        message: (e as Error).message,
      });
      throw e;
    }
  },

  runTask: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project || project.status === "Processing") return;
    set({
      projects: get().projects.map((p) =>
        p.id === id ? { ...p, status: "Processing", progress: 0 } : p,
      ),
    });
    get().pushLog({
      level: "info",
      source: "transform",
      message: `Task started · ${project.title}`,
    });
    try {
      await runTransformationTask(id, (progress) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, progress } : p,
          ),
        });
      });
      set({
        projects: get().projects.map((p) =>
          p.id === id ? { ...p, status: "Completed", progress: 100 } : p,
        ),
      });
      get().pushLog({
        level: "success",
        source: "transform",
        message: `Task complete · ${project.title}`,
      });
    } catch (e) {
      set({
        projects: get().projects.map((p) =>
          p.id === id ? { ...p, status: "Draft" } : p,
        ),
      });
      get().pushLog({
        level: "error",
        source: "transform",
        message: (e as Error).message,
      });
      throw e;
    }
  },

  pushLog: (entry) =>
    set({
      logs: [
        { ...entry, id: crypto.randomUUID(), ts: Date.now() },
        ...get().logs,
      ].slice(0, 50),
    }),

  tick: () => {
    const s = get().system;
    if (!s) return;
    const cpu = clamp(s.cpu_load + (Math.random() - 0.5) * 0.08);
    const kg = clamp(s.kg_sync + (Math.random() - 0.45) * 0.02);
    const health = clamp(s.system_health + (Math.random() - 0.5) * 0.01, 0.85, 1);
    const sov = clamp(
      s.sovereignty_index + (Math.random() - 0.5) * 0.004,
      0.5,
      1,
    );
    set({
      system: { ...s, cpu_load: cpu, kg_sync: kg, system_health: health, sovereignty_index: sov },
      cpuHistory: [...get().cpuHistory, cpu].slice(-60),
      kgHistory: [...get().kgHistory, kg].slice(-60),
    });
  },
}));
