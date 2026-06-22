import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Plus, Trash2, Network } from "lucide-react";
import { toast } from "sonner";

import { LevelHeader } from "@/components/level-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTaskStatus,
  type TaskRow,
} from "@/lib/api";
import { useRealtimeQuery } from "@/hooks/use-realtime";

export const Route = createFileRoute("/_authenticated/l6")({
  head: () => ({
    meta: [
      { title: "MALEKA Ω · L6 Diplomacy Orchestrator" },
      { name: "description", content: "Federation task orchestration with priority and live status." },
    ],
  }),
  component: L6Page,
});

const STATUSES: TaskRow["status"][] = ["Pending", "InProgress", "Completed", "Failed"];
const PRIORITIES: TaskRow["priority"][] = ["Low", "Medium", "High", "Critical"];

const STATUS_COLOR: Record<TaskRow["status"], string> = {
  Pending: "bg-muted text-muted-foreground",
  InProgress: "bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/30",
  Completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Failed: "bg-destructive/15 text-destructive border-destructive/30",
};
const PRIORITY_COLOR: Record<TaskRow["priority"], string> = {
  Low: "text-muted-foreground",
  Medium: "text-cyber-cyan",
  High: "text-amber-300",
  Critical: "text-rose-300",
};

function L6Page() {
  const qc = useQueryClient();
  useRealtimeQuery("tasks", ["tasks"]);
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: listTasks });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskRow["status"] }) => updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const grouped = STATUSES.reduce<Record<TaskRow["status"], TaskRow[]>>(
    (acc, s) => ({ ...acc, [s]: (tasks.data ?? []).filter((t) => t.status === s) }),
    {} as Record<TaskRow["status"], TaskRow[]>,
  );

  return (
    <div>
      <LevelHeader
        level="L6 · Diplomacy"
        title="Federation Orchestrator"
        subtitle="Task coordination across the sovereign federation."
        icon={Handshake}
        actions={<NewTaskDialog />}
      />

      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((status) => (
          <div key={status} className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight">{status}</h3>
              <Badge variant="outline" className={STATUS_COLOR[status]}>
                {grouped[status].length}
              </Badge>
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {grouped[status].map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="group rounded-xl border border-border/60 bg-card/40 p-3 transition-all hover:border-cyber-cyan/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        {t.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {t.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                          <span className={PRIORITY_COLOR[t.priority] + " font-medium uppercase tracking-wider"}>
                            ◆ {t.priority}
                          </span>
                          {t.federation_node && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Network className="h-3 w-3" /> {t.federation_node}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => remove.mutate(t.id)}
                        className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Select
                      value={t.status}
                      onValueChange={(v) => setStatus.mutate({ id: t.id, status: v as TaskRow["status"] })}
                    >
                      <SelectTrigger className="mt-2 h-7 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                ))}
              </AnimatePresence>
              {grouped[status].length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-[11px] text-muted-foreground">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewTaskDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskRow["priority"]>("Medium");
  const [node, setNode] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createTask({
        title,
        description: description || undefined,
        priority,
        federation_node: node || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task dispatched");
      setOpen(false);
      setTitle("");
      setDescription("");
      setNode("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispatch federation task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskRow["priority"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Federation node" value={node} onChange={(e) => setNode(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!title || create.isPending}>
            {create.isPending ? "Dispatching…" : "Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
