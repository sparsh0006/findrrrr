// ─── Database model types (matching Prisma schema) ─────────────────────

export interface Transaction {
  id: string;
  hash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string | null;
  value: string; // wei as string
  gasPrice: string;
  gasUsed: string | null;
  input: string | null;
  nonce: number;
  success: boolean;
  createdAt: string;
}

export interface TokenTransfer {
  id: string;
  hash: string;
  tokenAddress: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  logIndex: number;
  blockNumber: number;
  createdAt: string;
}

export interface LargeTransfer {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  valueWei: string;
  blockNumber: number;
  blockTime: string | null;
  createdAt: string;
}

export interface FailedTransaction {
  id: string;
  hash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string | null;
  gasUsed: string | null;
  revertReason: string | null;
  input: string | null;
  createdAt: string;
}

// ─── API response types ────────────────────────────────────────────────

export interface DashboardStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  largeTransfers: number;
  tokenTransfers: number;
  latestBlock: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
}

export interface BlockChartPoint {
  block: number;
  txCount: number;
  failed: number;
  gasAvg: number;
}

export interface AddressInfo {
  address: string;
  txCount: number;
  totalSent: string;
  totalReceived: string;
  transactions: Transaction[];
  tokenBalances: { token: string; balance: string }[];
}

export interface TransactionDetail extends Transaction {
  tokenTransfers: TokenTransfer[];
}

// ─── Filter types ──────────────────────────────────────────────────────

export interface TokenFilterState {
  enabled: boolean;
  min: string;
  max: string;
}

export interface TokenFilters {
  [key: string]: TokenFilterState;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tokens?: string;
  defi?: boolean;
  [key: string]: string | number | boolean | undefined;
}
