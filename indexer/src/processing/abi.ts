import { ethers } from 'ethers';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export const ERC20_IFACE = new ethers.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]);

export const PANCAKE_V2_IFACE = new ethers.Interface([
  // Swap(sender, amount0In, amount1In, amount0Out, amount1Out, to)
  'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
]);

export const PANCAKE_V3_IFACE = new ethers.Interface([
  // Swap(sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick)
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
]);

// ─── Decoded result types ─────────────────────────────────────────────────────

export interface DecodedTransfer {
  from: string;
  to: string;
  amount: bigint;
}

export interface DecodedPancakeV2Swap {
  sender: string;
  to: string;
  amount0In: bigint;
  amount1In: bigint;
  amount0Out: bigint;
  amount1Out: bigint;
}

export interface DecodedPancakeV3Swap {
  sender: string;
  recipient: string;
  amount0: bigint;
  amount1: bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
}

// ─── Log shape expected by decoders ──────────────────────────────────────────

interface RawLog {
  topics: string[];
  data: string;
  address?: string;
}

// ─── Decoders ─────────────────────────────────────────────────────────────────

/**
 * Decodes an ERC-20 / BEP-20 Transfer event log.
 * Returns null if the log does not match the Transfer signature.
 */
export function decodeTransferLog(log: RawLog): DecodedTransfer | null {
  try {
    const parsed = ERC20_IFACE.parseLog({ topics: log.topics, data: log.data });
    if (!parsed || parsed.name !== 'Transfer') return null;
    return {
      from:   parsed.args.from as string,
      to:     parsed.args.to   as string,
      amount: parsed.args.value as bigint,
    };
  } catch {
    return null;
  }
}

/**
 * Decodes a PancakeSwap V2 Swap event log.
 */
export function decodePancakeV2SwapLog(log: RawLog): DecodedPancakeV2Swap | null {
  try {
    const parsed = PANCAKE_V2_IFACE.parseLog({ topics: log.topics, data: log.data });
    if (!parsed || parsed.name !== 'Swap') return null;
    return {
      sender:     parsed.args.sender     as string,
      to:         parsed.args.to         as string,
      amount0In:  parsed.args.amount0In  as bigint,
      amount1In:  parsed.args.amount1In  as bigint,
      amount0Out: parsed.args.amount0Out as bigint,
      amount1Out: parsed.args.amount1Out as bigint,
    };
  } catch {
    return null;
  }
}

/**
 * Decodes a PancakeSwap V3 Swap event log.
 */
export function decodePancakeV3SwapLog(log: RawLog): DecodedPancakeV3Swap | null {
  try {
    const parsed = PANCAKE_V3_IFACE.parseLog({ topics: log.topics, data: log.data });
    if (!parsed || parsed.name !== 'Swap') return null;
    return {
      sender:       parsed.args.sender       as string,
      recipient:    parsed.args.recipient    as string,
      amount0:      parsed.args.amount0      as bigint,
      amount1:      parsed.args.amount1      as bigint,
      sqrtPriceX96: parsed.args.sqrtPriceX96 as bigint,
      liquidity:    parsed.args.liquidity    as bigint,
      tick:         Number(parsed.args.tick),
    };
  } catch {
    return null;
  }
}
