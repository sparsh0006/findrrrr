import { ethers } from 'ethers';
import { db } from '../database/client';
import { TransactionFilters } from './filters';
import { decodeTransferLog } from './abi';
import { ERC20_TRANSFER_TOPIC } from '../rpc/subscriptions';
import { IndexerConfig } from '../types';

export class DataHandler {
  private config: IndexerConfig;

  constructor(config: IndexerConfig) {
    this.config = config;
  }

  // ─── Block-level entry point ─────────────────────────────────────────────────

  async handleBlock(block: ethers.Block, provider: ethers.JsonRpcProvider): Promise<void> {
    const txCount = block.transactions.length;
    if (txCount === 0) {
      console.log(`[BLOCK] ${block.number} — empty`);
      return;
    }

    console.log(`[BLOCK] ${block.number} — ${txCount} tx(s)`);

    // Fetch all receipts in parallel (batched)
    const receipts = await Promise.all(
      block.transactions.map((hash) => provider.getTransactionReceipt(hash)),
    );

    for (let i = 0; i < block.transactions.length; i++) {
      const txHash = block.transactions[i];
      const receipt = receipts[i];
      if (!receipt) continue;

      // getTransaction gives us value, input, nonce, gasPrice
      const tx = await provider.getTransaction(txHash);
      if (!tx) continue;

      await this.handleTransaction(tx, receipt, block);
    }
  }

  // ─── Per-transaction dispatch ────────────────────────────────────────────────

  async handleTransaction(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    block: ethers.Block,
  ): Promise<void> {
    try {
      const success = receipt.status === 1;
      const gasPrice = tx.gasPrice ?? 0n;

      await db.prisma.transaction.upsert({
        where: { hash: tx.hash },
        create: {
          hash:        tx.hash,
          blockNumber: BigInt(tx.blockNumber ?? block.number),
          fromAddress: tx.from,
          toAddress:   tx.to ?? null,
          value:       tx.value.toString(),
          gasPrice:    gasPrice.toString(),
          gasUsed:     receipt.gasUsed.toString(),
          input:       tx.data && tx.data.length > 2 ? tx.data : null,
          nonce:       tx.nonce,
          success,
        },
        update: {
          gasUsed: receipt.gasUsed.toString(),
          success,
        },
      });

      await this.handleLargeTransfer(tx, receipt, block);
      await this.handleTokenTransfers(receipt);
      if (!success) await this.handleFailedTransaction(tx, receipt);
    } catch (error) {
      console.error(`Error handling transaction ${tx.hash}`, error);
    }
  }

  // ─── Large native BNB transfer ───────────────────────────────────────────────

  async handleLargeTransfer(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    block: ethers.Block,
  ): Promise<void> {
    if (!TransactionFilters.isNativeBNBTransfer(tx) || !tx.to) return;
    if (!TransactionFilters.isLargeTransfer(tx, this.config.largeTransferThresholdBNB)) return;

    try {
      const blockTime = block.timestamp ? new Date(block.timestamp * 1000) : null;

      await db.prisma.largeTransfer.upsert({
        where: { hash: tx.hash },
        create: {
          hash:        tx.hash,
          fromAddress: tx.from,
          toAddress:   tx.to,
          valueWei:    tx.value.toString(),
          blockNumber: BigInt(tx.blockNumber ?? block.number),
          blockTime,
        },
        update: {},
      });

      const bnb = TransactionFilters.weiToBNB(tx.value);
      console.log(
        `[LARGE] ${bnb.toFixed(2)} BNB  ${tx.from.slice(0, 8)}... → ${tx.to.slice(0, 8)}...`,
      );
    } catch (error) {
      console.error('Error handling large transfer', error);
    }
  }

  // ─── BEP-20 token transfers (from event logs) ────────────────────────────────

  async handleTokenTransfers(receipt: ethers.TransactionReceipt): Promise<void> {
    const transferLogs = receipt.logs.filter(
      (log) => log.topics[0] === ERC20_TRANSFER_TOPIC,
    );

    if (transferLogs.length === 0) return;

    // Only persist transfers for tokens we're tracking (or all, if list is empty)
    const trackAll = this.config.trackedTokens.length === 0;
    const trackedSet = new Set(this.config.trackedTokens.map((a) => a.toLowerCase()));

    for (const log of transferLogs) {
      if (!trackAll && !trackedSet.has(log.address.toLowerCase())) continue;

      const decoded = decodeTransferLog({
        topics: [...log.topics],
        data:   log.data,
      });

      if (!decoded) continue;

      try {
        await db.prisma.tokenTransfer.create({
          data: {
            hash:         receipt.hash,
            tokenAddress: log.address,
            fromAddress:  decoded.from,
            toAddress:    decoded.to,
            amount:       decoded.amount.toString(),
            logIndex:     log.index,
            blockNumber:  BigInt(receipt.blockNumber),
          },
        });
      } catch (error) {
        // Ignore duplicate inserts (re-processed block)
        if (!(error as any)?.code?.includes('P2002')) {
          console.error('Error saving token transfer', error);
        }
      }
    }
  }

  // ─── Failed transactions ──────────────────────────────────────────────────────

  async handleFailedTransaction(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
  ): Promise<void> {
    try {
      const revertReason = await this.tryDecodeRevertReason(tx);

      await db.prisma.failedTransaction.upsert({
        where: { hash: tx.hash },
        create: {
          hash:         tx.hash,
          blockNumber:  BigInt(receipt.blockNumber),
          fromAddress:  tx.from,
          toAddress:    tx.to ?? null,
          gasUsed:      receipt.gasUsed.toString(),
          revertReason: revertReason ?? null,
          input:        tx.data && tx.data.length > 2 ? tx.data : null,
        },
        update: {},
      });

      console.log(
        `[FAILED] ${tx.hash.slice(0, 12)}...${revertReason ? ` — ${revertReason}` : ''}`,
      );
    } catch (error) {
      console.error('Error handling failed transaction', error);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Attempts to extract a human-readable revert reason from the calldata.
   * Returns null when the reason cannot be decoded.
   */
  private async tryDecodeRevertReason(tx: ethers.TransactionResponse): Promise<string | null> {
    try {
      if (!tx.data || tx.data.length <= 2) return null;
      // Standard revert string: selector 0x08c379a0 + ABI-encoded string
      if (tx.data.startsWith('0x08c379a0')) {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['string'],
          '0x' + tx.data.slice(10),
        );
        return decoded[0] as string;
      }
      return null;
    } catch {
      return null;
    }
  }
}
