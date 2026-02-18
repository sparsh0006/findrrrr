"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTransaction } from "@/lib/api";
import { formatNumber, formatBNB, formatGwei, formatDate, shortenHash, formatAddress, copyToClipboard } from "@/lib/utils";
import { DEFI_CONTRACTS } from "@/lib/constants";
import type { TransactionDetail } from "@/lib/types";

export function TxDetailClient({ hash }: { hash: string }) {
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setTx(await getTransaction(hash));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [hash]);

  if (loading) return <div className="p-16 text-center text-[#484f58]">Loading...</div>;
  if (!tx) return <div className="p-16 text-center text-[#484f58]">Transaction not found</div>;

  const defiLabel = tx.toAddress ? DEFI_CONTRACTS[tx.toAddress.toLowerCase()] : null;

  const infoRows = [
    ["Status", tx.success ? "✅ Success" : "❌ Failed"],
    ["Block", formatNumber(tx.blockNumber)],
    ["From", tx.fromAddress],
    ["To", tx.toAddress || "Contract Creation"],
    ["Value", `${formatBNB(tx.value)} BNB`],
    ...(defiLabel ? [["Contract", defiLabel]] : []),
  ];

  const gasRows = [
    ["Gas Used", formatNumber(tx.gasUsed)],
    ["Gas Price", formatGwei(tx.gasPrice)],
    ["Nonce", String(tx.nonce)],
    ["Timestamp", formatDate(tx.createdAt)],
    ["Input Data", tx.input && tx.input !== "0x" ? `${tx.input.slice(0, 20)}...` : "—"],
  ];

  return (
    <div>
      <Link href="/transactions" className="flex items-center gap-1.5 text-[#8b949e] no-underline text-[13px] font-semibold mb-4 hover:text-accent">
        ← Back to Transactions
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-extrabold">Transaction Details</h1>
        <div className="font-mono text-xs text-accent mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="break-all">{hash}</span>
          <button onClick={() => copyToClipboard(hash)} className="bg-transparent border-none cursor-pointer text-[#484f58] hover:text-accent" title="Copy">📋</button>
          <a href={`https://bscscan.com/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] text-[11px] no-underline">
            BscScan ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Overview */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b949e] mb-4">Overview</div>
          {infoRows.map(([label, val], i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border">
              <span className="text-[#484f58] text-xs">{label}</span>
              <span className="text-xs font-mono text-[#8b949e]">
                {label === "From" || label === "To" ? (
                  <Link href={`/address/${val}`} className="text-accent no-underline hover:text-white font-mono text-[11px]">
                    {val}
                  </Link>
                ) : (
                  val
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Gas */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b949e] mb-4">Gas & Technical</div>
          {gasRows.map(([label, val], i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border">
              <span className="text-[#484f58] text-xs">{label}</span>
              <span className="text-xs font-mono text-[#8b949e]">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Token Transfers */}
      {tx.tokenTransfers?.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-border text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
            Token Transfers ({tx.tokenTransfers.length})
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Token", "From", "To", "Amount"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#484f58] uppercase tracking-[0.1em] border-b border-border bg-surface">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tx.tokenTransfers.map((tt, i) => (
                <tr key={i} className="border-b border-border hover:bg-hover">
                  <td className="px-4 py-2.5 text-[11px] font-mono text-[#8b949e]">{formatAddress(tt.tokenAddress)}</td>
                  <td className="px-4 py-2.5 text-[11px] font-mono text-[#8b949e]">{formatAddress(tt.fromAddress)}</td>
                  <td className="px-4 py-2.5 text-[11px] font-mono text-[#8b949e]">{formatAddress(tt.toAddress)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono">{formatNumber(tt.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw JSON */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div
          onClick={() => setShowRaw(!showRaw)}
          className="px-5 py-3.5 cursor-pointer flex items-center justify-between border-b border-border"
        >
          <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b949e]">
            💻 Raw Transaction Data
          </span>
          <span className={`text-[#484f58] transition-transform ${showRaw ? "rotate-90" : ""}`}>›</span>
        </div>
        {showRaw && (
          <pre className="p-5 text-[11px] font-mono text-[#8b949e] overflow-auto max-h-[400px] m-0">
            {JSON.stringify(tx, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
