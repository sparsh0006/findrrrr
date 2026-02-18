import { IndexerConfig } from '../types';

// ─── BSC Contract Addresses ───────────────────────────────────────────────────

export const BSC_CONTRACTS = {
  PANCAKESWAP_V2_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  PANCAKESWAP_V3_ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  PANCAKESWAP_V2_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  ONEINCH_ROUTER: '0x1111111254EEB25477B68fb85Ed929f73A960582',
  BISWAP_ROUTER: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
} as const;

// ─── BSC Token Addresses ──────────────────────────────────────────────────────

export const BSC_TOKENS = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
  ETH:  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
} as const;

// ─── Event Topics ─────────────────────────────────────────────────────────────

// keccak256("Transfer(address,address,uint256)")
export const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// keccak256("Swap(address,uint256,uint256,uint256,uint256,address)") — PancakeSwap V2
export const PANCAKE_V2_SWAP_TOPIC =
  '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';

// keccak256("Swap(address,address,int256,int256,uint160,uint128,int24)") — PancakeSwap V3
export const PANCAKE_V3_SWAP_TOPIC =
  '0x19b47279256b2a23a1665c810c8d55a1758940ee09377d4f8d26497a3577dc83';

// ─── Config Factories ─────────────────────────────────────────────────────────

export function createDefaultConfig(): IndexerConfig {
  return {
    trackedContracts: Object.values(BSC_CONTRACTS),
    trackedTokens: [BSC_TOKENS.USDT, BSC_TOKENS.BUSD, BSC_TOKENS.WBNB],
    largeTransferThresholdBNB: parseInt(process.env.LARGE_TRANSFER_THRESHOLD_BNB || '100'),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '2000'),
  };
}

export function createDeFiConfig(): IndexerConfig {
  return {
    trackedContracts: [
      BSC_CONTRACTS.PANCAKESWAP_V2_ROUTER,
      BSC_CONTRACTS.PANCAKESWAP_V3_ROUTER,
      BSC_CONTRACTS.ONEINCH_ROUTER,
      BSC_CONTRACTS.BISWAP_ROUTER,
    ],
    trackedTokens: Object.values(BSC_TOKENS),
    largeTransferThresholdBNB: parseInt(process.env.LARGE_TRANSFER_THRESHOLD_BNB || '100'),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '2000'),
  };
}

export function createTokenConfig(tokens: string[]): IndexerConfig {
  return {
    trackedContracts: [],
    trackedTokens: tokens,
    largeTransferThresholdBNB: parseInt(process.env.LARGE_TRANSFER_THRESHOLD_BNB || '100'),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '2000'),
  };
}
