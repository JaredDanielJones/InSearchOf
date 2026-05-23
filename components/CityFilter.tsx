"use client";

import { useState } from "react";
import { CITIES, type CityConfig } from "@/lib/cities";

interface CityFilterProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
}

const REGION_LABELS: Record<CityConfig["region"], string> = {
  west: "🌊 West",
  central: "🌾 Central",
  south: "☀️ South",
  east: "🗽 East",
};

const REGION_COLORS: Record<CityConfig["region"], string> = {
  west: "text-blue-600",
  central: "text-green-600",
  south: "text-orange-600",
  east: "text-red-600",
};

const REGIONS: CityConfig["region"][] = ["west", "central", "south", "east"];

export default function CityFilter({ selectedCities, onChange }: CityFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (key: string) => {
    if (selectedCities.includes(key)) {
      onChange(selectedCities.filter((c) => c !== key));
    } else {
      onChange([...selectedCities, key]);
    }
  };

  const selectRegion = (region: CityConfig["region"]) => {
    const regionKeys = CITIES.filter((c) => c.region === region).map((c) => c.key);
    const allSelected = regionKeys.every((k) => selectedCities.includes(k));
    if (allSelected) {
      // Deselect region
      onChange(selectedCities.filter((k) => !regionKeys.includes(k)));
    } else {
      // Select all in region
      const merged = Array.from(new Set([...selectedCities, ...regionKeys]));
      onChange(merged);
    }
  };

  const selectAll = () => onChange(CITIES.map((c) => c.key));
  const clearAll = () => onChange([]);

  const selectedCount = selectedCities.length;
  const totalCount = CITIES.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium bg-white hover:bg-gray-50 shadow-sm transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        <span>
          {selectedCount === totalCount
            ? "All Cities"
            : selectedCount === 0
            ? "No Cities"
            : `${selectedCount} Cities`}
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl z-20 overflow-hidden">
            {/* Select all / Clear */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">
                {selectedCount}/{totalCount} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:underline"
                >
                  All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:underline"
                >
                  None
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {REGIONS.map((region) => {
                const regionCities = CITIES.filter((c) => c.region === region);
                const allRegionSelected = regionCities.every((c) =>
                  selectedCities.includes(c.key)
                );

                return (
                  <div key={region} className="border-b border-gray-50 last:border-b-0">
                    {/* Region header */}
                    <button
                      onClick={() => selectRegion(region)}
                      className={`w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors ${REGION_COLORS[region]}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {REGION_LABELS[region]}
                      </span>
                      <span className="text-xs opacity-70">
                        {allRegionSelected ? "Deselect all" : "Select all"}
                      </span>
                    </button>

                    {/* City checkboxes */}
                    <div className="pb-1">
                      {regionCities.map((city) => (
                        <label
                          key={city.key}
                          className="flex items-center gap-3 px-6 py-1.5 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCities.includes(city.key)}
                            onChange={() => toggle(city.key)}
                            className="w-3.5 h-3.5 rounded accent-blue-600"
                          />
                          <span className="text-sm text-gray-700">{city.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
