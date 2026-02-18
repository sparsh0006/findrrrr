import { API_BASE } from "./constants";
import type {
  DashboardStats,
  PaginatedResponse,
  Transaction,
  TokenTransfer,
  LargeTransfer,
  FailedTransaction,
  TransactionDetail,
  AddressInfo,
  BlockChartPoint,
  TransactionQueryParams,
} from "./types";

const USE_DEMO_MODE = false;

// ─── API functions (all use cache-busting timestamp) ───────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats?_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}

export async function getChartData(): Promise<BlockChartPoint[]> {
  const res = await fetch(`${API_BASE}/chart/blocks?_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}

export async function getTransactions(
  params: TransactionQueryParams = {}
): Promise<PaginatedResponse<Transaction>> {
  const q = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`${API_BASE}/transactions?${q}&_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}

export async function getTokenTransfers(
  params: TransactionQueryParams = {}
): Promise<PaginatedResponse<TokenTransfer>> {
  const q = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`${API_BASE}/token-transfers?${q}&_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}

export async function getLargeTransfers(
  params: TransactionQueryParams = {}
): Promise<PaginatedResponse<LargeTransfer>> {
  const q = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`${API_BASE}/large-transfers?${q}&_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}

export async function getFailedTransactions(
  params: TransactionQueryParams = {}
): Promise<PaginatedResponse<FailedTransaction>> {
  const q = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(`${API_BASE}/failed-transactions?${q}&_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}

export async function getTransaction(hash: string): Promise<TransactionDetail> {
  const res = await fetch(`${API_BASE}/tx/${hash}?_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}

export async function getAddress(addr: string): Promise<AddressInfo> {
  const res = await fetch(`${API_BASE}/address/${addr}?_t=${Date.now()}`, { cache: "no-store" });
  return res.json();
}