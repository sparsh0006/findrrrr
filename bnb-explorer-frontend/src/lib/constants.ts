// ─── Tracked BSC tokens ────────────────────────────────────────────────

export const TOKENS: Record<
  string,
  { symbol: string; name: string; color: string; address: string | null; decimals: number }
> = {
  BNB:  { symbol: "BNB",  name: "BNB Native",   color: "#f0b90b", address: null, decimals: 18 },
  USDT: { symbol: "USDT", name: "Tether USD",   color: "#26a17b", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  BUSD: { symbol: "BUSD", name: "Binance USD",  color: "#f0b90b", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18 },
  WBNB: { symbol: "WBNB", name: "Wrapped BNB",  color: "#f3ba2f", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18 },
  USDC: { symbol: "USDC", name: "USD Coin",     color: "#2775ca", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
  BTCB: { symbol: "BTCB", name: "Bitcoin BEP2", color: "#f7931a", address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18 },
};

// ─── Known DeFi contracts ──────────────────────────────────────────────

export const DEFI_CONTRACTS: Record<string, string> = {
  "0x10ed43c718714eb63d5aa57b78b54704e256024e": "PancakeSwap V2",
  "0x13f4ea83d0bd40e75c8222255bc855a974568dd4": "PancakeSwap V3",
  "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch",
  "0x3a6d8ca21d1cf76f653a67577fa0d27453350dd8": "BiSwap",
};

// ─── API ───────────────────────────────────────────────────────────────

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const POLL_INTERVAL_MS = 5000;
