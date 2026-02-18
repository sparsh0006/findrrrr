import { ethers } from 'ethers';
import {
  decodeTransferLog,
  decodePancakeV2SwapLog,
  decodePancakeV3SwapLog,
  ERC20_IFACE,
  PANCAKE_V2_IFACE,
  PANCAKE_V3_IFACE,
} from './abi';
import { ERC20_TRANSFER_TOPIC } from '../rpc/subscriptions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTransferLog(from: string, to: string, amount: bigint) {
  const encoded = ERC20_IFACE.encodeEventLog('Transfer', [from, to, amount]);
  return { topics: encoded.topics as string[], data: encoded.data };
}

function makePancakeV2SwapLog(
  sender: string,
  to: string,
  amount0In: bigint,
  amount1In: bigint,
  amount0Out: bigint,
  amount1Out: bigint,
) {
  const encoded = PANCAKE_V2_IFACE.encodeEventLog('Swap', [
    sender, amount0In, amount1In, amount0Out, amount1Out, to,
  ]);
  return { topics: encoded.topics as string[], data: encoded.data };
}

function makePancakeV3SwapLog(
  sender: string,
  recipient: string,
  amount0: bigint,
  amount1: bigint,
) {
  const encoded = PANCAKE_V3_IFACE.encodeEventLog('Swap', [
    sender, recipient, amount0, amount1,
    BigInt('1234567890123456789'), // sqrtPriceX96 placeholder
    BigInt('999999999999'),         // liquidity placeholder
    -887272,                        // tick placeholder
  ]);
  return { topics: encoded.topics as string[], data: encoded.data };
}

// ─── decodeTransferLog ────────────────────────────────────────────────────────

describe('decodeTransferLog', () => {
  const FROM    = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const TO      = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
  const AMOUNT  = 1_000_000n; // 1 USDT (6 decimals)

  it('decodes a valid Transfer log', () => {
    const log = makeTransferLog(FROM, TO, AMOUNT);
    const result = decodeTransferLog(log);

    expect(result).not.toBeNull();
    expect(result!.from.toLowerCase()).toBe(FROM.toLowerCase());
    expect(result!.to.toLowerCase()).toBe(TO.toLowerCase());
    expect(result!.amount).toBe(AMOUNT);
  });

  it('uses the correct ERC-20 Transfer topic', () => {
    const log = makeTransferLog(FROM, TO, AMOUNT);
    expect(log.topics[0]).toBe(ERC20_TRANSFER_TOPIC);
  });

  it('returns null for mismatched topic', () => {
    const log = makeTransferLog(FROM, TO, AMOUNT);
    const corruptedLog = { ...log, topics: ['0xdeadbeef', ...log.topics.slice(1)] };
    const result = decodeTransferLog(corruptedLog);
    expect(result).toBeNull();
  });

  it('returns null for empty log', () => {
    const result = decodeTransferLog({ topics: [], data: '0x' });
    expect(result).toBeNull();
  });
});

// ─── decodePancakeV2SwapLog ───────────────────────────────────────────────────

describe('decodePancakeV2SwapLog', () => {
  const SENDER = '0x1111111111111111111111111111111111111111';
  const TO     = '0x2222222222222222222222222222222222222222';

  it('decodes a valid PancakeSwap V2 Swap log', () => {
    const log = makePancakeV2SwapLog(SENDER, TO, 500n, 0n, 0n, 1000n);
    const result = decodePancakeV2SwapLog(log);

    expect(result).not.toBeNull();
    expect(result!.sender.toLowerCase()).toBe(SENDER.toLowerCase());
    expect(result!.to.toLowerCase()).toBe(TO.toLowerCase());
    expect(result!.amount0In).toBe(500n);
    expect(result!.amount1Out).toBe(1000n);
  });

  it('returns null for wrong event data', () => {
    const result = decodePancakeV2SwapLog({ topics: ['0xdeadbeef'], data: '0x' });
    expect(result).toBeNull();
  });
});

// ─── decodePancakeV3SwapLog ───────────────────────────────────────────────────

describe('decodePancakeV3SwapLog', () => {
  const SENDER    = '0x3333333333333333333333333333333333333333';
  const RECIPIENT = '0x4444444444444444444444444444444444444444';

  it('decodes a valid PancakeSwap V3 Swap log', () => {
    const log = makePancakeV3SwapLog(SENDER, RECIPIENT, 100n, -200n);
    const result = decodePancakeV3SwapLog(log);

    expect(result).not.toBeNull();
    expect(result!.sender.toLowerCase()).toBe(SENDER.toLowerCase());
    expect(result!.recipient.toLowerCase()).toBe(RECIPIENT.toLowerCase());
    expect(result!.amount0).toBe(100n);
    expect(result!.amount1).toBe(-200n);
  });

  it('returns null for invalid log', () => {
    const result = decodePancakeV3SwapLog({ topics: [], data: '0x' });
    expect(result).toBeNull();
  });
});
