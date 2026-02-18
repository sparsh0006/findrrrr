// ─── Hash / address formatting ─────────────────────────────────────────

export function shortenHash(hash: string | null, start = 6, end = 4): string {
  if (!hash) return "—";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function formatAddress(address: string | null): string {
  return shortenHash(address, 6, 4);
}

// ─── Value formatting ──────────────────────────────────────────────────

export function formatBNB(weiString: string | null): string {
  if (!weiString) return "0";
  try {
    const val = Number(BigInt(weiString)) / 1e18;
    if (val === 0) return "0";
    if (val < 0.001) return val.toExponential(2);
    return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return "0";
  }
}

export function formatTokenAmount(raw: string | null, decimals = 18): string {
  if (!raw) return "0";
  try {
    const val = Number(BigInt(raw)) / Math.pow(10, decimals);
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } catch {
    return "0";
  }
}

export function formatGwei(weiString: string | null): string {
  if (!weiString) return "—";
  try {
    return (Number(weiString) / 1e9).toFixed(2) + " Gwei";
  } catch {
    return "—";
  }
}

// ─── Number / date formatting ──────────────────────────────────────────

export function formatNumber(n: number | string | null): string {
  if (n == null) return "—";
  return Number(n).toLocaleString();
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Clipboard ─────────────────────────────────────────────────────────

export function copyToClipboard(text: string): void {
  navigator.clipboard?.writeText(text);
}

// ─── Search type detection ─────────────────────────────────────────────

export function detectSearchType(input: string): "tx" | "address" | "block" | "unknown" {
  const v = input.trim();
  if (v.startsWith("0x") && v.length === 66) return "tx";
  if (v.startsWith("0x") && v.length === 42) return "address";
  if (/^\d+$/.test(v)) return "block";
  return "unknown";
}
