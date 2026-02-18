"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getAddress } from "@/lib/api";
import { formatNumber, formatBNB, shortenHash, copyToClipboard } from "@/lib/utils";
import type { AddressInfo } from "@/lib/types";

export function AddressClient({ address }: { address: string }) {
  const [data, setData] = useState<AddressInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await getAddress(address));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [address]);

  if (loading) return <div className="p-16 text-center text-[#484f58]">Loading...</div>;
  if (!data) return <div className="p-16 text-center text-[#484f58]">Address not found</div>;

  const activityData = (data.transactions || []).slice(0, 15).map((tx, i) => ({
    idx: i,
    value: Number(BigInt(tx.value || "0")) / 1e18,
  }));

  return (
    <div>
      <Link href="/transactions" className="text-[#8b949e] no-underline text-[13px] font-semibold mb-4 block hover:text-accent">
        ← Back
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-extrabold">Address</h1>
        <div className="font-mono text-xs text-accent mt-1.5 flex items-center gap-2">
          <span className="break-all">{address}</span>
          <button onClick={() => copyToClipboard(address)} className="bg-transparent border-none cursor-pointer text-[#484f58]">📋</button>
          <a href={`https://bscscan.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] text-[11px] no-underline">
            BscScan ↗
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5 mb-6">
        {[
          { label: "Total Txns", value: formatNumber(data.txCount), icon: "📊", color: "#f0b90b" },
          { label: "Total Sent", value: `${formatBNB(data.totalSent)} BNB`, icon: "📤", color: "#f6465d" },
          { label: "Total Received", value: `${formatBNB(data.totalReceived)} BNB`, icon: "📥", color: "#0ecb81" },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-[18px] relative overflow-hidden hover:border-border-glow transition-all">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }} />
            <div className="text-[11px] text-[#484f58] uppercase tracking-[0.1em] font-bold">{c.label}</div>
            <div className="text-2xl font-extrabold mt-2 mb-1 font-mono tracking-tight">{c.value}</div>
            <div className="absolute top-4 right-4 text-[22px] opacity-10">{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b949e] mb-4">Activity</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={activityData}>
            <XAxis dataKey="idx" tick={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#484f58" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip />
            <Bar dataKey="value" fill="#f0b90b" radius={[4, 4, 0, 0]} name="BNB Value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Token Balances */}
      {data.tokenBalances?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b949e] mb-4">Token Balances</div>
          {data.tokenBalances.map((b, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border">
              <span className="font-bold text-[13px]">{b.token}</span>
              <span className="font-mono text-xs text-[#8b949e]">{formatBNB(b.balance)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Txs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
          Recent Transactions
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Tx Hash", "Block", "Value (BNB)", "Status"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#484f58] uppercase tracking-[0.1em] border-b border-border bg-surface">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.transactions || []).slice(0, 15).map((tx) => (
              <tr key={tx.hash} className="border-b border-border hover:bg-hover transition-colors">
                <td className="px-4 py-2.5">
                  <Link href={`/tx/${tx.hash}`} className="font-mono text-[11px] text-accent no-underline hover:text-white">{shortenHash(tx.hash)}</Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[#8b949e]">{formatNumber(tx.blockNumber)}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{formatBNB(tx.value)}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    tx.success ? "bg-success/10 text-success" : "bg-failed/10 text-failed"
                  }`}>
                    {tx.success ? "Success" : "Failed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
