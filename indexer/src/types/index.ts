export interface TransactionData {
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  blockNumber: number;
  gasPrice: bigint;
  gasLimit: bigint;
  nonce: number;
  input: string;
  status: 'success' | 'failed';
}

export interface TokenTransferData {
  hash: string;
  tokenAddress: string;
  from: string;
  to: string;
  amount: bigint;
  logIndex: number;
  blockNumber: number;
}

export interface ProcessedTransaction {
  id: string;
  hash: string;
  blockNumber: number;
  blockTime: Date;
  gasPrice: bigint;
  gasUsed: bigint;
  status: string;
  contractAddresses: string[];
  from: string;
  to: string | null;
  value: bigint;
  input?: string;
}

export interface FilterOptions {
  minValueBNB?: number;
  maxValueBNB?: number;
  contracts?: string[];
  addresses?: string[];
  includeSuccess?: boolean;
  includeFailed?: boolean;
}

export interface IndexerStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  uptime: number;
  lastProcessedBlock: number;
}

export interface IndexerConfig {
  trackedContracts: string[];
  trackedTokens: string[];
  largeTransferThresholdBNB: number;
  pollIntervalMs: number;
}
