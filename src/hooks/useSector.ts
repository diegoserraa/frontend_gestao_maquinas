import { useEffect, useState } from "react";
import { getSectors } from "@/modules/sector/sectorService";
import type { Setor } from "@/modules/machine/machineTypes";

export function useSectors() {
  const [sectors, setSectors] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSectors()
      .then(setSectors)
      .finally(() => setLoading(false));
  }, []);

  return { sectors, loading };
}