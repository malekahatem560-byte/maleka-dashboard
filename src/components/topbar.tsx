import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BadgeCheck, Download, FileJson, FileText, LogOut, User2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { getKernelStatus } from "@/lib/api";
import { exportJSON, exportPDF } from "@/lib/report";

export function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const kernel = useQuery({
    queryKey: ["kernel-status"],
    queryFn: getKernelStatus,
    refetchInterval: 5000,
  });

  const user = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initial = user.data?.email?.[0]?.toUpperCase() ?? "Ω";

  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex items-center gap-2">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/10 px-3 py-1 text-xs font-medium text-cyber-cyan"
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          Sovereignty Verified
        </motion.div>
        <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
          CCI {kernel.data ? kernel.data.sovereignty_index.toFixed(3) : "—"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
          {now.toLocaleTimeString()}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Download className="h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>System report</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                toast.promise(exportJSON(), {
                  loading: "Compiling JSON…",
                  success: "Snapshot exported",
                  error: "Export failed",
                })
              }
            >
              <FileJson className="mr-2 h-4 w-4" /> JSON snapshot
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast.promise(exportPDF(), {
                  loading: "Rendering PDF…",
                  success: "Report ready",
                  error: "Export failed",
                })
              }
            >
              <FileText className="mr-2 h-4 w-4" /> PDF report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {initial}
              </span>
              <span className="hidden text-xs sm:inline">{user.data?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Identity kernel</DropdownMenuLabel>
            <DropdownMenuItem disabled>
              <User2 className="mr-2 h-4 w-4" /> {user.data?.email ?? "—"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
