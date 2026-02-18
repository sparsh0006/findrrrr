"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { detectSearchType, formatNumber } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [liveBlock, setLiveBlock] = useState(45000000);

  // Simulate live block counter
  useEffect(() => {
    const iv = setInterval(() => setLiveBlock((p) => p + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !search.trim()) return;
    const type = detectSearchType(search.trim());
    switch (type) {
      case "tx":
        router.push(`/tx/${search.trim()}`);
        break;
      case "address":
        router.push(`/address/${search.trim()}`);
        break;
      default:
        router.push(`/transactions?search=${encodeURIComponent(search.trim())}`);
    }
    setSearch("");
  };

  return (
    <header className="h-[60px] bg-surface border-b border-border flex items-center gap-4 px-6 sticky top-0 z-50">
      {/* Search */}
      <div className="flex-1 max-w-[560px] flex items-center gap-2.5 bg-card border border-border rounded-lg px-3.5 py-2 focus-within:border-accent transition-colors">
        <span className="text-[#484f58] text-sm">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search tx hash / address / block..."
          className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] font-mono text-xs placeholder:text-[#484f58]"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <span className="bg-accent/15 border border-accent-dim text-accent px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
          BSC
        </span>
        <span className="font-mono text-[11px] text-[#8b949e] flex items-center gap-1.5">
          ⛓ #{formatNumber(liveBlock)}
        </span>
      </div>
    </header>
  );
}
