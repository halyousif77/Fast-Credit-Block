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

type SavedFilters = { regions: string[]; cities: string[]; vans: string[] };

type RegionFilterContextType = {
  loading: boolean;
  rows: CreditRow[];
  filteredRows: CreditRow[];
  allRegions: string[];
  citiesByRegion: Map<string, string[]>;
  selectedRegions: string[];
  selectedCities: string[];
  setSelectedRegions: (regions: string[]) => Promise<void>;
  setSelectedCities: (cities: string[]) => Promise<void>;
  clearFilters: () => Promise<void>;
  refresh: () => Promise<void>;
};

const RegionFilterContext = createContext<RegionFilterContextType>({
  loading: true, rows: [], filteredRows: [], allRegions: [], citiesByRegion: new Map(),
  selectedRegions: [], selectedCities: [],
  setSelectedRegions: async () => {}, setSelectedCities: async () => {},
  clearFilters: async () => {}, refresh: async () => {},
});

function getFilterKey(user: string) {
  return user ? `savedFilters_${user}` : "savedFilters_guest";
}

async function loadSavedFilters(user: string): Promise<SavedFilters> {
  if (user) {
    const { data } = await supabase.from("user_filters").select("*").eq("username", user).maybeSingle();
    if (data) return { regions: data.regions || [], cities: data.cities || [], vans: data.vans || [] };
  }
  const saved = await storage.getItem(getFilterKey(user));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { regions: parsed.regions || [], cities: parsed.cities || [], vans: parsed.vans || [] };
    } catch {}
  }
  return { regions: [], cities: [], vans: [] };
}

async function persistFilters(user: string, filters: SavedFilters) {
  await storage.setItem(getFilterKey(user), JSON.stringify(filters));
  if (user) {
    await supabase.from("user_filters").upsert({
      username: user, regions: filters.regions, cities: filters.cities, vans: filters.vans,
    });
  }
}

export function RegionFilterProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<CreditRow[]>([]);
  const [currentUser, setCurrentUser] = useState("");
  const [selectedRegions, setSelectedRegionsState] = useState<string[]>([]);
  const [selectedCities, setSelectedCitiesState] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const user = (await storage.getItem("currentUser")) || "";
    setCurrentUser(user);
    const data = await fetchCreditRows();
    setRows(data);
    const saved = await loadSavedFilters(user);
    setSelectedRegionsState(saved.regions);
    setSelectedCitiesState(saved.cities);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onUserChanged = () => refresh();
    window.addEventListener("user-changed", onUserChanged);
    return () => window.removeEventListener("user-changed", onUserChanged);
  }, [refresh]);

  const allRegions = useMemo(
    () => Array.from(new Set(rows.map(r => r.region).filter(Boolean))).sort(),
    [rows]
  );

  const citiesByRegion = useMemo(() => {
    const map = new Map<string, string[]>();
    rows.forEach(r => {
      if (!r.region || !r.city) return;
      if (!map.has(r.region)) map.set(r.region, []);
      if (!map.get(r.region)!.includes(r.city)) map.get(r.region)!.push(r.city);
    });
    map.forEach((cities, region) => map.set(region, cities.sort()));
    return map;
  }, [rows]);

  const selectedRegionSet = new Set(selectedRegions);
  const selectedCitySet = new Set(selectedCities);

  const filteredRows = useMemo(() => {
    if (selectedRegions.length === 0 && selectedCities.length === 0) return rows;
    return rows.filter(r =>
      (selectedRegions.length === 0 || selectedRegionSet.has(r.region)) &&
      (selectedCities.length === 0 || selectedCitySet.has(r.city))
    );
  }, [rows, selectedRegions, selectedCities]);

  const save = useCallback(async (regions: string[], cities: string[]) => {
    const vans = Array.from(new Set(
      rows
        .filter(r => (regions.length === 0 || regions.includes(r.region)) &&
                     (cities.length === 0 || cities.includes(r.city)))
        .map(r => r.vanCode).filter(Boolean)
    ));
    await persistFilters(currentUser, { regions, cities, vans });
  }, [currentUser, rows]);

  const setSelectedRegions = useCallback(async (regions: string[]) => {
    setSelectedRegionsState(regions);

    // Mirror the desktop filter. A selected region selects its cities; East
    // additionally includes North / Hafer Al Batin so the HFR vans are included.
    const cities = Array.from(new Set([
      ...regions.flatMap(region => citiesByRegion.get(region) || []),
      ...(regions.includes("East") ? ["Hafer Al Batin"] : []),
    ]));

    setSelectedCitiesState(cities);
    await save(regions, cities);
  }, [citiesByRegion, save]);

  const setSelectedCities = useCallback(async (cities: string[]) => {
    setSelectedCitiesState(cities);
    const regions = selectedRegions;
    await save(regions, cities);
  }, [selectedRegions, save]);

  const clearFilters = useCallback(async () => {
    setSelectedRegionsState([]);
    setSelectedCitiesState([]);
    await persistFilters(currentUser, { regions: [], cities: [], vans: [] });
  }, [currentUser]);

  return (
    <RegionFilterContext.Provider value={{
      loading, rows, filteredRows, allRegions, citiesByRegion,
      selectedRegions, selectedCities, setSelectedRegions, setSelectedCities,
      clearFilters, refresh,
    }}>
      {children}
    </RegionFilterContext.Provider>
  );
}

export function useRegionFilter() {
  return useContext(RegionFilterContext);
}
