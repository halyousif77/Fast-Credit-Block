"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { storage as localStorage } from "@/utils/storage";

export default function GlobalFilter() {
  const [showFilters, setShowFilters] = useState(false);

  const [data, setData] = useState<any[]>([]);

  const [currentUser, setCurrentUser] = useState("");

  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedVans, setSelectedVans] = useState<string[]>([]);

  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const [expandedCities, setExpandedCities] = useState<string[]>([]);

  // Toggle global filter
useEffect(() => {
  const syncVans = async () => {
    if (!data.length) return;

    const user =
      await localStorage.getItem(
        "currentUser"
      );

    const filterKey = user
      ? `savedFilters_${user}`
      : "savedFilters_guest";

    const saved =
      await localStorage.getItem(
        filterKey
      );

    if (!saved) return;

    const filters = JSON.parse(saved);

    const vans = data
      .filter((row) => {
        const regionMatch =
          filters.regions?.length === 0 ||
          filters.regions?.includes(
            row["Region"]
          );

        const cityMatch =
          filters.cities?.length === 0 ||
          filters.cities?.includes(
            row["City"]
          );

        return (
          regionMatch &&
          cityMatch
        );
      })
      .map((row) => row["Van Code."])
      .filter(Boolean);
const updatedFilters = {
  regions: filters.regions || [],
  cities: filters.cities || [],
  vans: [...new Set(vans)],
};

await localStorage.setItem(
  filterKey,
  JSON.stringify(updatedFilters)
);

if (user) {
  await supabase
    .from("user_filters")
    .upsert({
      username: user,
      regions: updatedFilters.regions,
      cities: updatedFilters.cities,
      vans: updatedFilters.vans,
    });
}

setSelectedRegions(updatedFilters.regions);
setSelectedCities(updatedFilters.cities);
setSelectedVans(updatedFilters.vans);
    
  };

  syncVans();
}, [data]);

  useEffect(() => {
    const handleToggleFilters = () => {
      setShowFilters((prev) => !prev);
    };

    window.addEventListener(
      "toggle-filters",
      handleToggleFilters
    );

    return () => {
      window.removeEventListener(
        "toggle-filters",
        handleToggleFilters
      );
    };
  }, []);

  // Load credit data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/credit-data");

        const result = await response.json();

        setData(result.data || []);
      } catch (error) {
        console.error(
          "Failed to load credit data:",
          error
        );
        setData([]);
      }
    };

    loadData();
  }, []);

  // Load saved filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const user = await localStorage.getItem(
          "currentUser"
        );

        setCurrentUser(user || "");

        const filterKey = user
          ? `savedFilters_${user}`
          : "savedFilters_guest";

        const saved = await localStorage.getItem(
          filterKey
        );

        if (!saved) return;

        const filters = JSON.parse(saved);

        setSelectedRegions(
          filters.regions || []
        );

        setSelectedCities(
          filters.cities || []
        );

              } catch (error) {
        console.error(
          "Failed to load saved filters:",
          error
        );
      }
    };

    loadFilters();
  }, []);

  // Get regions
  const regions = useMemo(() => {
    return [
      ...new Set(
        data.map((row) => row["Region"])
      ),
    ]
      .filter(Boolean)
      .sort();
  }, [data]);

  // Get cities by region
  const citiesByRegion = useMemo(() => {
    const map = new Map<string, Set<string>>();

    data.forEach((row) => {
      const region = row["Region"];
      const city = row["City"];

      if (!region || !city) return;

      if (!map.has(region)) {
        map.set(region, new Set());
      }

      map.get(region)!.add(city);
    });

    return map;
  }, [data]);

  // Get vans by city
  const vansByCity = useMemo(() => {
    const map = new Map<string, Set<string>>();

    data.forEach((row) => {
      const region = row["Region"];
      const city = row["City"];
      const van = row["Van Code."];

      if (!region || !city || !van) return;

      const key = `${region}|${city}`;

      if (!map.has(key)) {
        map.set(key, new Set());
      }

      map.get(key)!.add(van);
    });

    return map;
  }, [data]);

  // Toggle region expansion
  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  // Toggle city expansion
  const toggleCity = (cityKey: string) => {
    setExpandedCities((prev) =>
      prev.includes(cityKey)
        ? prev.filter((c) => c !== cityKey)
        : [...prev, cityKey]
    );
  };

  return (
    <>
      {showFilters && (
        <div className="fixed top-16 right-4 z-50 w-80 rounded-xl border bg-white p-4 shadow-xl">
          <div className="mb-3 text-lg font-semibold">
            Saudi
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {regions.map((region) => {
              const regionCities = Array.from(
                citiesByRegion.get(region) || []
              );

              const regionVans = data
                .filter(
                  (row) =>
                    row["Region"] === region
                )
                .map(
                  (row) =>
                    row["Van Code."]
                )
                .filter(Boolean);

              return (
                <div
                  key={region}
                  className="border-b last:border-b-0"
                >
                  {/* Region */}
                  <div className="flex items-center gap-2 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleRegion(region)
                      }
                      className="w-5 text-sm"
                    >
                      {expandedRegions.includes(
                        region
                      )
                        ? "▼"
                        : "▶"}
                    </button>

                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(
                        region
                      )}
                      onChange={(e) => {
  const isEast = region === "East";

  const haferVans = data
    .filter(
      (row) =>
        row["Region"] === "North" &&
        row["City"] === "Hafer Al Batin"
    )
    .map((row) => row["Van Code."])
    .filter(Boolean);

  if (e.target.checked) {
    setSelectedRegions((prev) => [
      ...new Set([
        ...prev,
        region,
        ...(isEast ? ["North"] : []),
      ]),
    ]);

    setSelectedCities((prev) => [
      ...new Set([
        ...prev,
        ...regionCities,
        ...(isEast ? ["Hafer Al Batin"] : []),
      ]),
    ]);

    setSelectedVans((prev) => [
      ...new Set([
        ...prev,
        ...regionVans,
        ...(isEast ? haferVans : []),
      ]),
    ]);
  } else {
    setSelectedRegions((prev) =>
      prev.filter(
        (r) =>
          r !== region &&
          !(isEast && r === "North")
      )
    );

    setSelectedCities((prev) =>
      prev.filter(
        (city) =>
          !regionCities.includes(city) &&
          !(isEast && city === "Hafer Al Batin")
      )
    );

    setSelectedVans((prev) =>
      prev.filter(
        (van) =>
          !regionVans.includes(van) &&
          !(isEast && haferVans.includes(van))
      )
    );
  }
}}
                    />

                    <span className="font-medium">
                      {region}
                    </span>
                  </div>

                  {/* Cities */}
                  {expandedRegions.includes(
                    region
                  ) && (
                    <div className="ml-7">
                      {regionCities.map(
                        (city) => {
                          const cityKey = `${region}|${city}`;

                          const cityVans =
                            Array.from(
                              vansByCity.get(
                                cityKey
                              ) || []
                            );

                          return (
                            <div
                              key={cityKey}
                            >
                              <div className="flex items-center gap-2 py-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleCity(
                                      cityKey
                                    )
                                  }
                                  className="w-5 text-xs"
                                >
                                  {expandedCities.includes(
                                    cityKey
                                  )
                                    ? "▼"
                                    : "▶"}
                                </button>

                                <input
                                  type="checkbox"
                                  checked={selectedCities.includes(
                                    city
                                  )}
                                  onChange={(
                                    e
                                  ) => {
                                    if (
                                      e
                                        .target
                                        .checked
                                    ) {
                                      setSelectedCities(
                                        (
                                          prev
                                        ) => [
                                          ...new Set(
                                            [
                                              ...prev,
                                              city,
                                            ]
                                          ),
                                        ]
                                      );

                                      setSelectedVans(
                                        (
                                          prev
                                        ) => [
                                          ...new Set(
                                            [
                                              ...prev,
                                              ...cityVans,
                                            ]
                                          ),
                                        ]
                                      );
                                    } else {
                                      setSelectedCities(
                                        (
                                          prev
                                        ) =>
                                          prev.filter(
                                            (
                                              c
                                            ) =>
                                              c !==
                                              city
                                          )
                                      );

                                      setSelectedVans(
                                        (
                                          prev
                                        ) =>
                                          prev.filter(
                                            (
                                              v
                                            ) =>
                                              !cityVans.includes(
                                                v
                                              )
                                          )
                                      );
                                    }
                                  }}
                                />

                                <span>
                                  {city}
                                </span>
                              </div>

                              {/* Vans */}
                              {expandedCities.includes(
                                cityKey
                              ) && (
                                <div className="ml-7">
                                  {cityVans.map(
                                    (
                                      van
                                    ) => (
                                      <label
                                        key={
                                          van
                                        }
                                        className="flex items-center gap-2 py-1"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedVans.includes(
                                            van
                                          )}
                                          onChange={(
                                            e
                                          ) => {
                                            if (
                                              e
                                                .target
                                                .checked
                                            ) {
                                              setSelectedVans(
                                                (
                                                  prev
                                                ) => [
                                                  ...new Set(
                                                    [
                                                      ...prev,
                                                      van,
                                                    ]
                                                  ),
                                                ]
                                              );
                                            } else {
                                              setSelectedVans(
                                                (
                                                  prev
                                                ) =>
                                                  prev.filter(
                                                    (
                                                      v
                                                    ) =>
                                                      v !==
                                                      van
                                                  )
                                              );
                                            }
                                          }}
                                        />

                                        <span>
                                          {
                                            van
                                          }
                                        </span>
                                      </label>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
  <button
    className="bg-red-600 text-white px-4 py-2 rounded-lg"
    onClick={() => {
      setSelectedRegions([]);
      setSelectedCities([]);
      setSelectedVans([]);
    }}
  >
    Clear
  </button>

  <button
    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    onClick={async () => {
      const filterData = {
        regions: selectedRegions,
        cities: selectedCities,
        vans: selectedVans,
      };

      const filterKey = currentUser
        ? `savedFilters_${currentUser}`
        : "savedFilters_guest";

      await localStorage.setItem(
  filterKey,
  JSON.stringify(filterData)
);

if (currentUser) {
  await supabase
    .from("user_filters")
    .upsert({
      username: currentUser,
      regions: selectedRegions,
      cities: selectedCities,
      vans: selectedVans,
    });
}

setShowFilters(false);

window.location.reload();
    }}
  >
    Apply
  </button>
  
</div>

        </div>
      )}
    </>
  );
}
