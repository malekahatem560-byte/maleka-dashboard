import { useEffect } from "react";
import { useSystemStore } from "@/store/system-store";
import { MALEKA_CONFIG } from "@/config/maleka";

export function useSystemLogic() {
  const bootstrap = useSystemStore((s) => s.bootstrap);
  const tick = useSystemStore((s) => s.tick);
  const status = useSystemStore((s) => s.status);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status !== "ready") return;
    const id = setInterval(tick, MALEKA_CONFIG.tickIntervalMs);
    return () => clearInterval(id);
  }, [status, tick]);
}
