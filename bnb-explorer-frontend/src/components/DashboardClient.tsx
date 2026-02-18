"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber, formatBNB, shortenHash, formatAddress, formatDate } from "@/lib/utils";
import { API_BASE, POLL_INTERVAL_MS } from "@/lib/constants";
import type { DashboardStats, Transaction, BlockChartPoint } from "@/lib/types";

// Direct fetch with cache-busting timestamp to guarantee fresh data
async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats?_t=${Date.now()}`);
  return res.json();
}

async function fetchChart(): Promise<BlockChartPoint[]> {
  const res = await fetch(`${API_BASE}/chart/blocks?_t=${Date.now()}`);
  return res.json();
}

async function fetchRecentTxs(): Promise<{ data: Transaction[] }> {
  const res = await fetch(`${API_BASE}/transactions?limit=12&_t=${Date.now()}`);
  return res.json();
}

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<BlockChartPoint[]>([]);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [s, c, t] = await Promise.all([
        fetchStats(),
        fetchChart(),
        fetchRecentTxs(),
      ]);
      setStats(s);
      setChartData(c);
      setRecentTxs(t.data || []);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
  }, []);

useEffect(() => {
  fetchAll(); // initial fetch
  intervalRef.current = setInterval(fetchAll, POLL_INTERVAL_MS); // Refreshes every 5 seconds
  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
}, [fetchAll]);

  const pieData = stats
    ? [
        { name: "Success", value: stats.successfulTransactions, color: "#0ecb81" },
        { name: "Failed", value: stats.failedTransactions, color: "#f6465d" },
      ]
    : [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Dashboard</h1>
        <p style={{ color: "#8b949e", fontSize: 13, marginTop: 2 }}>
          BNB Smart Chain real-time overview
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Transactions", value: stats ? formatNumber(stats.totalTransactions) : "—", icon: "📊", color: "#f0b90b" },
          { label: "Successful", value: stats ? formatNumber(stats.successfulTransactions) : "—", icon: "✅", color: "#0ecb81" },
          { label: "Failed", value: stats ? formatNumber(stats.failedTransactions) : "—", icon: "❌", color: "#f6465d" },
          { label: "Large Transfers", value: stats ? formatNumber(stats.largeTransfers) : "—", icon: "🐋", color: "#3b82f6" },
          { label: "Token Transfers", value: stats ? formatNumber(stats.tokenTransfers) : "—", icon: "🪙", color: "#a855f7" },
          { label: "Latest Block", value: stats ? formatNumber(stats.latestBlock) : "—", icon: "⛓", color: "#f0b90b" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "#111820", border: "1px solid #1e2d3d", borderRadius: 12,
            padding: 18, position: "relative", overflow: "hidden",
            transition: "border-color 0.2s, transform 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a4060"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2d3d"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />
            <div style={{ fontSize: 11, color: "#484f58", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 4px", fontFamily: "'Space Mono', monospace", letterSpacing: "-0.03em" }}>{card.value}</div>
            <div style={{ position: "absolute", top: 16, right: 16, fontSize: 22, opacity: 0.12 }}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#111820", border: "1px solid #1e2d3d", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", marginBottom: 16 }}>
            <span style={{ color: "#f0b90b" }}>■</span> Transactions per Block
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0b90b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f0b90b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="block" tick={{ fontSize: 10, fill: "#484f58" }} tickFormatter={(v) => String(v).slice(-4)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#484f58" }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ background: "#111820", border: "1px solid #2a4060", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="txCount" stroke="#f0b90b" fill="url(#txGrad)" strokeWidth={2} name="Transactions" dot={false} />
              <Area type="monotone" dataKey="failed" stroke="#f6465d" fill="rgba(246,70,93,0.08)" strokeWidth={1.5} name="Failed" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#111820", border: "1px solid #1e2d3d", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", marginBottom: 16 }}>Success vs Failed</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 4 }}>
            {pieData.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8b949e" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                {d.name} ({formatNumber(d.value)})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: "#111820", border: "1px solid #1e2d3d", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1e2d3d" }}>
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>Recent Transactions</span>
          <Link href="/transactions" style={{ border: "1px solid #1e2d3d", borderRadius: 6, padding: "4px 10px", color: "#f0b90b", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>View All →</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Tx Hash", "Block", "From", "To", "Value (BNB)", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#484f58", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #1e2d3d", background: "#0d1117", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTxs.map((tx) => (
                <tr key={tx.hash} style={{ borderBottom: "1px solid #1e2d3d", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#161e28"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 16px", fontSize: 12 }}>
                    <Link href={`/tx/${tx.hash}`} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#f0b90b", textDecoration: "none" }}>{shortenHash(tx.hash)}</Link>
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>{formatNumber(tx.blockNumber)}</td>
                  <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
                    <Link href={`/address/${tx.fromAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>{formatAddress(tx.fromAddress)}</Link>
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8b949e" }}>
                    <Link href={`/address/${tx.toAddress}`} style={{ color: "#8b949e", textDecoration: "none" }}>{formatAddress(tx.toAddress)}</Link>
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>{formatBNB(tx.value)}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      background: tx.success ? "rgba(14,203,129,0.1)" : "rgba(246,70,93,0.1)",
                      color: tx.success ? "#0ecb81" : "#f6465d",
                      border: `1px solid ${tx.success ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)"}`,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                      {tx.success ? "Success" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
              {recentTxs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#484f58" }}>Loading...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}