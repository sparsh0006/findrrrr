import { BSC_CONTRACTS } from '../rpc/subscriptions';

export class TransactionFilters {
  // ─── Known DeFi contract addresses ──────────────────────────────────────────
  static readonly PANCAKESWAP_V2   = BSC_CONTRACTS.PANCAKESWAP_V2_ROUTER;
  static readonly PANCAKESWAP_V3   = BSC_CONTRACTS.PANCAKESWAP_V3_ROUTER;
  static readonly ONEINCH          = BSC_CONTRACTS.ONEINCH_ROUTER;
  static readonly BISWAP           = BSC_CONTRACTS.BISWAP_ROUTER;

  static readonly DEFI_CONTRACTS: ReadonlySet<string> = new Set(
    Object.values(BSC_CONTRACTS).map((a) => a.toLowerCase()),
  );

  // ─── Native BNB transfer detection ──────────────────────────────────────────

  /**
   * Returns true when the transaction carries no calldata — a plain BNB send.
   */
  static isNativeBNBTransfer(tx: { data: string }): boolean {
    return tx.data === '0x' || tx.data === '' || tx.data == null;
  }

  // ─── Large-transfer detection ────────────────────────────────────────────────

  /**
   * Returns true when the native BNB value exceeds `thresholdBNB`.
   * Operates on BigInt wei values to avoid floating-point errors.
   */
  static isLargeTransfer(tx: { value: bigint }, thresholdBNB: number = 100): boolean {
    const thresholdWei = BigInt(thresholdBNB) * BigInt(10 ** 18);
    return tx.value >= thresholdWei;
  }

  // ─── DeFi detection ──────────────────────────────────────────────────────────

  /**
   * Returns true when the transaction target is a known DeFi contract.
   */
  static isDeFiTransaction(tx: { to: string | null }): boolean {
    if (!tx.to) return false;
    return this.DEFI_CONTRACTS.has(tx.to.toLowerCase());
  }

  // ─── Amount helpers ───────────────────────────────────────────────────────────

  /**
   * Converts wei (BigInt) to BNB as a plain number.
   * Safe for display; don't use for on-chain math.
   */
  static weiToBNB(wei: bigint): number {
    return Number(wei) / 1e18;
  }

  /**
   * Returns the BNB value of a transaction, or null if zero.
   */
  static extractBNBAmount(tx: { value: bigint }): number | null {
    if (tx.value === 0n) return null;
    return this.weiToBNB(tx.value);
  }
}
