"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  getTransactions,
  getTokenTransfers,
  getLargeTransfers,
  getFailedTransactions,
} from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedSearch";
import { TOKENS } from "@/lib/constants";
import {
  formatNumber,
  formatBNB,
  formatTokenAmount,
  shortenHash,
  formatAddress,
  formatDate,
} from "@/lib/utils";
import type { TokenFilters } from "@/lib/types";

const TABS = [
  { key: "all", label: "All Transactions", icon: "🔄" },
  { key: "large", label: "Large Transfers", icon: "🐋" },
  { key: "failed", label: "Failed", icon: "❌" },
  { key: "tokens", label: "Token Transfers", icon: "🪙" },
  { key: "defi", label: "DeFi", icon: "⛓" },
];

interface TransactionsClientProps {
  initialTab?: string;
  initialSearch?: string;
}

export function TransactionsClient({
  initialTab = "all",
  initialSearch = "",
}: TransactionsClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search, 400);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tokenFilters, setTokenFilters] = useState<TokenFilters>(
    Object.fromEntries(
      Object.keys(TOKENS).map((k) => [k, { enabled: false, min: "", max: "" }])
    )
  );
  const [customToken, setCustomToken] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const params: any = { page, limit, search: debouncedSearch };
      const enabled = Object.entries(tokenFilters)
        .filter(([, v]) => v.enabled)
        .map(([k]) => k);
      if (enabled.length > 0) {
        params.tokens = enabled.join(",");
        enabled.forEach((t) => {
          if (tokenFilters[t].min) params[`min_${t}`] = tokenFilters[t].min;
          if (tokenFilters[t].max) params[`max_${t}`] = tokenFilters[t].max;
        });
      }

      let result;
      switch (activeTab) {
        case "large":
          result = await getLargeTransfers(params);
          break;
        case "failed":
          result = await getFailedTransactions(params);
          break;
        case "tokens":
          result = await getTokenTransfers(params);
          break;
        case "defi":
          result = await getTransactions({ ...params, defi: true });
          break;
        default:
          result = await getTransactions(params);
      }
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (e) {
      console.error("Fetch error:", e);
    }
    setLoading(false);
  }, [activeTab, page, debouncedSearch, tokenFilters]);

  // Fetch on mount and when params change
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Reset page when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  // Sync initialTab prop changes (from sidebar views)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const toggleToken = (key: string) =>
    setTokenFilters((p) => ({
      ...p,
      [key]: { ...p[key], enabled: !p[key].enabled },
    }));

  const resetFilters = () => {
    setTokenFilters(
      Object.fromEntries(
        Object.keys(TOKENS).map((k) => [k, { enabled: false, min: "", max: "" }])
      )
    );
    setCustomToken("");
  };

  const totalPages = Math.ceil(total / limit);

  const renderRow = (item: any) => {
    switch (activeTab) {
      case "tokens":
        return (
          <>
            <td style={{ padding: "11px 16px", fontSize: 11, fontWeight: 700, color: "#8b949e" }}>
              {Object.values(TOKENS).find(
                (t) => t.address?.toLowerCase() === item.tokenAddress?.toLowerCase()
              )?.symbol || formatAddress(item.tokenAddress)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              <Link href={`/address/${item.fromAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {formatAddress(item.fromAddress)}
              </Link>
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              <Link href={`/address/${item.toAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {formatAddress(item.toAddress)}
              </Link>
            </td>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
              {formatTokenAmount(item.amount)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              {formatNumber(item.blockNumber)}
            </td>
          </>
        );

      case "large":
        return (
          <>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              <Link href={`/address/${item.fromAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {formatAddress(item.fromAddress)}
              </Link>
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              <Link href={`/address/${item.toAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {formatAddress(item.toAddress)}
              </Link>
            </td>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#f0b90b" }}>
              {formatBNB(item.valueWei)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              {formatNumber(item.blockNumber)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, color: "#8b949e" }}>
              {formatDate(item.blockTime || item.createdAt)}
            </td>
          </>
        );

      case "failed":
        return (
          <>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              {formatAddress(item.fromAddress)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              {formatAddress(item.toAddress)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              {formatNumber(item.gasUsed)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, color: "#f6465d", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.revertReason || "Unknown"}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              {formatNumber(item.blockNumber)}
            </td>
          </>
        );

      default:
        return (
          <>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              {formatNumber(item.blockNumber)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              <Link href={`/address/${item.fromAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {formatAddress(item.fromAddress)}
              </Link>
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
              <Link href={`/address/${item.toAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {formatAddress(item.toAddress)}
              </Link>
            </td>
            <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
              {formatBNB(item.value)}
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#484f58" }}>
              {formatNumber(item.gasUsed)}
            </td>
            <td style={{ padding: "11px 16px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
                background: item.success ? "rgba(14,203,129,0.1)" : "rgba(246,70,93,0.1)",
                color: item.success ? "#0ecb81" : "#f6465d",
                border: `1px solid ${item.success ? "rgba(14,203,129,0.2)" : "rgba(246,70,93,0.2)"}`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                {item.success ? "Success" : "Failed"}
              </span>
            </td>
            <td style={{ padding: "11px 16px", fontSize: 11, color: "#8b949e" }}>
              {formatDate(item.createdAt)}
            </td>
          </>
        );
    }
  };

  const getHeaders = () => {
    switch (activeTab) {
      case "tokens": return ["Tx Hash", "Token", "From", "To", "Amount", "Block"];
      case "large": return ["Tx Hash", "From", "To", "Value (BNB)", "Block", "Time"];
      case "failed": return ["Tx Hash", "From", "To", "Gas Used", "Revert Reason", "Block"];
      default: return ["Tx Hash", "Block", "From", "To", "Value (BNB)", "Gas", "Status", "Time"];
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Transactions</h1>
        <p style={{ color: "#8b949e", fontSize: 13, marginTop: 2 }}>Browse, search and filter BSC transactions</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 10, padding: 4, marginBottom: 20, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "7px 14px", borderRadius: 7, border: "none", cursor: "pointer",
            fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700,
            color: activeTab === t.key ? "#f0b90b" : "#8b949e",
            background: activeTab === t.key ? "#111820" : "transparent",
            boxShadow: activeTab === t.key ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Search + Filter Toggle */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, maxWidth: 480, display: "flex", alignItems: "center", gap: 10, background: "#111820", border: "1px solid #1e2d3d", borderRadius: 8, padding: "8px 14px" }}>
          <span style={{ color: "#484f58" }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by tx hash, address, or block number..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e6edf3", fontFamily: "'Space Mono', monospace", fontSize: 12 }} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} style={{
          background: showFilters ? "rgba(240,185,11,0.15)" : "#111820",
          border: "1px solid #1e2d3d", borderRadius: 8, padding: "8px 14px",
          color: showFilters ? "#f0b90b" : "#8b949e", cursor: "pointer",
          fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
        }}>
          🔽 Filters
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showFilters ? "260px 1fr" : "1fr", gap: 20 }}>
        {/* Filter Panel */}
        {showFilters && (
          <div style={{ background: "#111820", border: "1px solid #1e2d3d", borderRadius: 12, padding: 18, height: "fit-content", position: "sticky", top: 80 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", marginBottom: 16 }}>Token Filters</div>

            {Object.entries(TOKENS).map(([key, token]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div onClick={() => toggleToken(key)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${tokenFilters[key]?.enabled ? "#b8890a" : "#1e2d3d"}`,
                  background: tokenFilters[key]?.enabled ? "rgba(240,185,11,0.08)" : "#0d1117",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: token.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: key === "USDT" || key === "USDC" ? "#fff" : "#000" }}>
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e6edf3" }}>{token.symbol}</div>
                      <div style={{ fontSize: 9, color: "#484f58" }}>{token.name}</div>
                    </div>
                  </div>
                  <div style={{ width: 32, height: 18, borderRadius: 9, background: tokenFilters[key]?.enabled ? "#f0b90b" : "#1e2d3d", position: "relative" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: tokenFilters[key]?.enabled ? 17 : 3, transition: "left 0.2s" }} />
                  </div>
                </div>
                {tokenFilters[key]?.enabled && (
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
  <input 
    value={tokenFilters[key].min} 
    onChange={(e) => setTokenFilters(p => ({...p, [key]: {...p[key], min: e.target.value}}))}
    placeholder="Min" 
    type="number"
    style={{ 
      flex: 1, minWidth: 0, width: "100%", // minWidth: 0 is the key fix
      background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 6, 
      padding: "6px 8px", color: "#e6edf3", fontSize: "11px", outline: "none" 
    }} 
  />
  <input 
    value={tokenFilters[key].max} 
    onChange={(e) => setTokenFilters(p => ({...p, [key]: {...p[key], max: e.target.value}}))}
    placeholder="Max" 
    type="number"
    style={{ 
      flex: 1, minWidth: 0, width: "100%", 
      background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 6, 
      padding: "6px 8px", color: "#e6edf3", fontSize: "11px", outline: "none" 
    }} 
  />
</div>
                )}
              </div>
            ))}

            <div style={{ marginTop: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#484f58", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Custom Token</div>
              <input value={customToken} onChange={(e) => setCustomToken(e.target.value)} placeholder="0x... contract address"
                style={{ width: "100%", background: "#0d1117", border: "1px solid #1e2d3d", borderRadius: 6, padding: "7px 10px", color: "#e6edf3", fontFamily: "'Space Mono', monospace", fontSize: 11, outline: "none" }} />
            </div>

                          <div style={{ display: "flex", gap: 8 }}>
              <button 
  onClick={(e) => {
    e.preventDefault();
    setPage(1); 
    fetchData(); 
  }} 
  style={{ 
    flex: 1, background: "#f0b90b", color: "#000", border: "none", 
    borderRadius: 6, padding: "10px", fontWeight: 800, cursor: "pointer", // Increased padding for better click area
    fontSize: 12, transition: "opacity 0.2s"
  }}
  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
>
  Apply
</button>
              <button onClick={resetFilters} style={{ flex: 1, background: "#0d1117", color: "#8b949e", border: "1px solid #1e2d3d", borderRadius: 6, padding: 8, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Reset</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#111820", border: "1px solid #1e2d3d", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1e2d3d" }}>
            <span style={{ fontSize: 12, color: "#8b949e" }}>{formatNumber(total)} results</span>
            <button onClick={fetchData} style={{ background: "none", border: "none", cursor: "pointer", color: "#484f58", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>🔄 Refresh</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            {loading && data.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#484f58" }}>Loading...</div>
            ) : data.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#484f58" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No {activeTab} transactions found</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {getHeaders().map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#484f58", textTransform: "uppercase" as const, letterSpacing: "0.1em", borderBottom: "1px solid #1e2d3d", background: "#0d1117", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, index: number) => (
                      <tr key={`${item.hash}-${item.id}-${index}`} style={{ borderBottom: "1px solid #1e2d3d" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#161e28"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "11px 16px", fontSize: 12 }}>
                        <Link href={`/tx/${item.hash}`} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#f0b90b", textDecoration: "none" }}>
                          {shortenHash(item.hash)}
                        </Link>
                      </td>
                      {renderRow(item)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "16px 0" }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{
                background: "#111820", border: "1px solid #1e2d3d", borderRadius: 6,
                padding: "6px 14px", color: "#8b949e", cursor: page <= 1 ? "default" : "pointer",
                fontSize: 12, fontWeight: 600, opacity: page <= 1 ? 0.4 : 1,
              }}>‹ Prev</button>
              <span style={{ fontSize: 12, color: "#8b949e", fontFamily: "'Space Mono', monospace", padding: "0 8px" }}>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{
                background: "#111820", border: "1px solid #1e2d3d", borderRadius: 6,
                padding: "6px 14px", color: "#8b949e", cursor: page >= totalPages ? "default" : "pointer",
                fontSize: 12, fontWeight: 600, opacity: page >= totalPages ? 0.4 : 1,
              }}>Next ›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}