"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { storage } from "@/utils/storage";
import { CreditRow, fetchCreditRows } from "@/lib/creditData";

type SavedFilters = {
  regions: string[];
  cities: string[];
  vans: string[];
};

type RegionFilterContextType = {
  loading: boolean;
  rows: CreditRow[];
  filteredRows: CreditRow[];
  allRegions: string[];
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => Promise<void>;
  refresh: () => Promise<void>;
};

const RegionFilterContext = createContext<RegionFilterContextType>({
  loading: true,
  rows: [],
  filteredRows: [],
  allRegions: [],
  selectedRegions: [],
  setSelectedRegions: async () => {},
  refresh: async () => {},
});

function getFilterKey(user: string) {
  return user ? `savedFilters_${user}` : "savedFilters_guest";
}

async function loadSavedFilters(user: string): Promise<SavedFilters> {
  if (user) {
    const { data } = await supabase
      .from("user_filters")
      .select("*")
      .eq("username", user)
      .maybeSingle();

    if (data) {
      return {
        regions: data.regions || [],
        cities: data.cities || [],
        vans: data.vans || [],
      };
    }
  }

  const saved = await storage.getItem(getFilterKey(user));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        regions: parsed.regions || [],
        cities: parsed.cities || [],
        vans: parsed.vans || [],
      };
    } catch {
      // fall through
    }
  }

  return { regions: [], cities: [], vans: [] };
}

async function persistFilters(user: string, filters: SavedFilters) {
  await storage.setItem(getFilterKey(user), JSON.stringify(filters));

  if (user) {
    await supabase.from("user_filters").upsert({
      username: user,
      regions: filters.regions,
      cities: filters.cities,
      vans: filters.vans,
    });
  }
}

export function RegionFilterProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<CreditRow[]>([]);
  const [currentUser, setCurrentUser] = useState("");
  const [selectedRegions, setSelectedRegionsState] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    const user = (await storage.getItem("currentUser")) || "";
    setCurrentUser(user);

    const data = await fetchCreditRows();
    setRows(data);

    const saved = await loadSavedFilters(user);
    setSelectedRegionsState(saved.regions);

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const onUserChanged = () => refresh();
    window.addEventListener("user-changed", onUserChanged);
    return () => window.removeEventListener("user-changed", onUserChanged);
  }, [refresh]);

  const allRegions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.region).filter(Boolean))).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedRegions.length === 0) return rows;
    return rows.filter((r) => selectedRegions.includes(r.region));
  }, [rows, selectedRegions]);

  const setSelectedRegions = useCallback(
    async (regions: string[]) => {
      setSelectedRegionsState(regions);

      // Keep the "vans" list (used by the desktop filter) in sync with the
      // chosen regions, mirroring GlobalFilter's own sync logic, so a
      // region picked on mobile also applies correctly if the same account
      // opens the desktop site later.
      const vans = Array.from(
        new Set(
          rows
            .filter((r) => regions.length === 0 || regions.includes(r.region))
            .map((r) => r.vanCode)
            .filter(Boolean)
        )
      );

      await persistFilters(currentUser, { regions, cities: [], vans });
    },
    [currentUser, rows]
  );

  return (
    <RegionFilterContext.Provider
      value={{
        loading,
        rows,
        filteredRows,
        allRegions,
        selectedRegions,
        setSelectedRegions,
        refresh,
      }}
    >
      {children}
    </RegionFilterContext.Provider>
  );
}

export function useRegionFilter() {
  return useContext(RegionFilterContext);
}
