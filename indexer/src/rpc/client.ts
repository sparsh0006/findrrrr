import { ethers } from 'ethers';
import { DataHandler } from '../processing/dataHandler';
import { IndexerConfig } from '../types';

export class BnbClient {
  private provider: ethers.JsonRpcProvider;
  private dataHandler: DataHandler;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private lastProcessedBlock: number = 0;
  private running: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectDelay: number;

  constructor() {
    const endpoint = process.env.RPC_ENDPOINT;
    if (!endpoint) {
      throw new Error('RPC_ENDPOINT environment variable is required');
    }

    this.provider = new ethers.JsonRpcProvider(endpoint);
    this.maxReconnectAttempts = parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '5');
    this.reconnectDelay = parseInt(process.env.RECONNECT_DELAY_MS || '5000');
    // DataHandler is initialised in start() once config is known
    this.dataHandler = null as unknown as DataHandler;
  }

  async start(config: IndexerConfig): Promise<void> {
    this.dataHandler = new DataHandler(config);
    this.running = true;

    // Anchor to the current chain tip so we only process new blocks
    this.lastProcessedBlock = (await this.provider.getBlockNumber()) - 1;
    console.log(`[BNB] Starting from block ${this.lastProcessedBlock + 1}`);

    this.scheduleNextPoll(config);
  }

  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('[BNB] Indexer stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }

  // ─── Poll loop ────────────────────────────────────────────────────────────────

  private scheduleNextPoll(config: IndexerConfig): void {
    if (!this.running) return;
    this.pollTimer = setTimeout(() => this.poll(config), config.pollIntervalMs);
  }

  private async poll(config: IndexerConfig): Promise<void> {
    try {
      const latestBlock = await this.provider.getBlockNumber();

      // Process every block we haven't seen yet (handles brief gaps / restarts)
      for (let n = this.lastProcessedBlock + 1; n <= latestBlock; n++) {
        const block = await this.provider.getBlock(n, true /* prefetchTxs */);
        if (!block) continue;

        await this.dataHandler.handleBlock(block, this.provider);
        this.lastProcessedBlock = n;
      }

      // Reset reconnect counter on success
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('[BNB] Poll error', error);
      await this.handleReconnection(config);
      return; // don't schedule next poll here; handleReconnection will retry
    }

    this.scheduleNextPoll(config);
  }

  // ─── Reconnection ─────────────────────────────────────────────────────────────

  private async handleReconnection(config: IndexerConfig): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[BNB] Max reconnection attempts reached. Exiting...');
      process.exit(1);
    }

    this.reconnectAttempts++;
    console.warn(
      `[BNB] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`,
    );

    setTimeout(() => {
      if (this.running) this.scheduleNextPoll(config);
    }, this.reconnectDelay);
  }
}
