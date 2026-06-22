export type AgentStatus = "Active" | "Idle" | "Processing";
export type ProjectStatus = "Draft" | "Processing" | "Completed";

export interface SystemState {
  sovereignty_index: number;
  active_agents: string[];
  system_health: number;
  cpu_load: number;
  kg_sync: number;
}

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  task: string;
  load: number;
}

export interface Project {
  id: string;
  title: string;
  progress: number;
  status: ProjectStatus;
}

export interface LogEntry {
  id: string;
  ts: number;
  level: "info" | "warn" | "error" | "success";
  source: string;
  message: string;
}

export interface SystemSnapshot {
  system: SystemState;
  agents: Agent[];
  projects: Project[];
}
