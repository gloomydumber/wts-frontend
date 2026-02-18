/**
 * Mock data for DexWidget — Phase 1 only.
 * Phase 2: Replace with real API calls via Tauri invoke().
 */

import type {
  TokenInfo,
  TokenBalance,
  SwapRoute,
  PerpPosition,
  FundingRate,
  PerpProtocolId,
} from './types'

// --- Token lists per chain ---

export const mockTokenLists: Record<string, TokenInfo[]> = {
  ethereum: [
    { address: 'native', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 'ethereum', priceUsd: 3450.00 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 'ethereum', priceUsd: 1.00 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 'ethereum', priceUsd: 1.00 },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai', decimals: 18, chainId: 'ethereum', priceUsd: 1.00 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8, chainId: 'ethereum', priceUsd: 97500.00 },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18, chainId: 'ethereum', priceUsd: 18.50 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18, chainId: 'ethereum', priceUsd: 12.30 },
  ],
  arbitrum: [
    { address: 'native', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 'arbitrum', priceUsd: 3450.00 },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 'arbitrum', priceUsd: 1.00 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 'arbitrum', priceUsd: 1.00 },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18, chainId: 'arbitrum', priceUsd: 1.15 },
    { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8, chainId: 'arbitrum', priceUsd: 97500.00 },
    { address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', symbol: 'GMX', name: 'GMX', decimals: 18, chainId: 'arbitrum', priceUsd: 35.20 },
  ],
  base: [
    { address: 'native', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 'base', priceUsd: 3450.00 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 'base', priceUsd: 1.00 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai', decimals: 18, chainId: 'base', priceUsd: 1.00 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped ETH', decimals: 18, chainId: 'base', priceUsd: 3450.00 },
  ],
  bsc: [
    { address: 'native', symbol: 'BNB', name: 'BNB', decimals: 18, chainId: 'bsc', priceUsd: 620.00 },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether', decimals: 18, chainId: 'bsc', priceUsd: 1.00 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18, chainId: 'bsc', priceUsd: 1.00 },
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18, chainId: 'bsc', priceUsd: 620.00 },
    { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', symbol: 'CAKE', name: 'PancakeSwap', decimals: 18, chainId: 'bsc', priceUsd: 2.80 },
  ],
  polygon: [
    { address: 'native', symbol: 'POL', name: 'Polygon', decimals: 18, chainId: 'polygon', priceUsd: 0.55 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 'polygon', priceUsd: 1.00 },
    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 'polygon', priceUsd: 1.00 },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped ETH', decimals: 18, chainId: 'polygon', priceUsd: 3450.00 },
  ],
  optimism: [
    { address: 'native', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 'optimism', priceUsd: 3450.00 },
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 'optimism', priceUsd: 1.00 },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 'optimism', priceUsd: 1.00 },
    { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18, chainId: 'optimism', priceUsd: 2.10 },
  ],
  solana: [
    { address: 'native', symbol: 'SOL', name: 'Solana', decimals: 9, chainId: 'solana', priceUsd: 185.00 },
    { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 'solana', priceUsd: 1.00 },
    { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 'solana', priceUsd: 1.00 },
    { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6, chainId: 'solana', priceUsd: 1.05 },
    { address: 'So11111111111111111111111111111111111111112', symbol: 'WSOL', name: 'Wrapped SOL', decimals: 9, chainId: 'solana', priceUsd: 185.00 },
    { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5, chainId: 'solana', priceUsd: 0.000028 },
  ],
}

// --- Token balances per chain (requires wallet) ---

export const mockTokenBalances: Record<string, TokenBalance[]> = {
  ethereum: [
    { token: mockTokenLists.ethereum[0], rawBalance: '2450000000000000000', formattedBalance: '2.45', usdValue: 8452.50 },
    { token: mockTokenLists.ethereum[1], rawBalance: '15000000000', formattedBalance: '15,000', usdValue: 15000.00 },
    { token: mockTokenLists.ethereum[2], rawBalance: '8500000000', formattedBalance: '8,500', usdValue: 8500.00 },
    { token: mockTokenLists.ethereum[4], rawBalance: '5000000', formattedBalance: '0.05', usdValue: 4875.00 },
    { token: mockTokenLists.ethereum[5], rawBalance: '250000000000000000000', formattedBalance: '250', usdValue: 4625.00 },
  ],
  arbitrum: [
    { token: mockTokenLists.arbitrum[0], rawBalance: '1800000000000000000', formattedBalance: '1.80', usdValue: 6210.00 },
    { token: mockTokenLists.arbitrum[2], rawBalance: '12000000000', formattedBalance: '12,000', usdValue: 12000.00 },
    { token: mockTokenLists.arbitrum[3], rawBalance: '5000000000000000000000', formattedBalance: '5,000', usdValue: 5750.00 },
    { token: mockTokenLists.arbitrum[5], rawBalance: '100000000000000000000', formattedBalance: '100', usdValue: 3520.00 },
  ],
  base: [
    { token: mockTokenLists.base[0], rawBalance: '3200000000000000000', formattedBalance: '3.20', usdValue: 11040.00 },
    { token: mockTokenLists.base[1], rawBalance: '25000000000', formattedBalance: '25,000', usdValue: 25000.00 },
  ],
  bsc: [
    { token: mockTokenLists.bsc[0], rawBalance: '8500000000000000000', formattedBalance: '8.50', usdValue: 5270.00 },
    { token: mockTokenLists.bsc[1], rawBalance: '10000000000000000000000', formattedBalance: '10,000', usdValue: 10000.00 },
    { token: mockTokenLists.bsc[4], rawBalance: '1500000000000000000000', formattedBalance: '1,500', usdValue: 4200.00 },
  ],
  polygon: [
    { token: mockTokenLists.polygon[0], rawBalance: '25000000000000000000000', formattedBalance: '25,000', usdValue: 13750.00 },
    { token: mockTokenLists.polygon[2], rawBalance: '5000000000', formattedBalance: '5,000', usdValue: 5000.00 },
  ],
  optimism: [
    { token: mockTokenLists.optimism[0], rawBalance: '1500000000000000000', formattedBalance: '1.50', usdValue: 5175.00 },
    { token: mockTokenLists.optimism[2], rawBalance: '8000000000', formattedBalance: '8,000', usdValue: 8000.00 },
    { token: mockTokenLists.optimism[3], rawBalance: '2000000000000000000000', formattedBalance: '2,000', usdValue: 4200.00 },
  ],
  solana: [
    { token: mockTokenLists.solana[0], rawBalance: '15000000000', formattedBalance: '15.00', usdValue: 2775.00 },
    { token: mockTokenLists.solana[2], rawBalance: '20000000000', formattedBalance: '20,000', usdValue: 20000.00 },
    { token: mockTokenLists.solana[3], rawBalance: '5000000000', formattedBalance: '5,000', usdValue: 5250.00 },
    { token: mockTokenLists.solana[5], rawBalance: '50000000000', formattedBalance: '500,000,000', usdValue: 14000.00 },
  ],
}

// --- Swap routes ---

export function mockSwapRoutes(chainId: string, tokenIn: string, tokenOut: string, amountIn: string): SwapRoute[] {
  const amt = parseFloat(amountIn) || 0
  if (amt <= 0) return []

  const variance = () => 0.97 + Math.random() * 0.06 // 97%–103%
  const baseOutput = amt * 1.0 // Simplified mock; real routes compute from token prices

  if (chainId === 'solana') {
    return [
      {
        aggregator: 'jupiter', aggregatorName: 'Jupiter', path: [tokenIn, tokenOut],
        protocols: ['Raydium', 'Orca'], estimatedOutput: (baseOutput * variance()).toFixed(6),
        priceImpact: 0.15, estimatedGasUsd: 0.002, estimatedTime: 2,
        minimumOutput: (baseOutput * 0.995).toFixed(6), isBest: true,
      },
      {
        aggregator: 'direct', aggregatorName: 'Raydium Direct', path: [tokenIn, tokenOut],
        protocols: ['Raydium'], estimatedOutput: (baseOutput * variance() * 0.998).toFixed(6),
        priceImpact: 0.25, estimatedGasUsd: 0.001, estimatedTime: 2,
        minimumOutput: (baseOutput * 0.993).toFixed(6), isBest: false,
      },
    ]
  }

  // EVM chains
  const routes: SwapRoute[] = [
    {
      aggregator: 'lifi', aggregatorName: 'LI.FI', path: [tokenIn, 'WETH', tokenOut],
      protocols: ['Uniswap V3', 'SushiSwap'], estimatedOutput: (baseOutput * variance()).toFixed(6),
      priceImpact: 0.12, estimatedGasUsd: 2.50, estimatedTime: 15,
      minimumOutput: (baseOutput * 0.995).toFixed(6), isBest: true,
    },
    {
      aggregator: '0x', aggregatorName: '0x', path: [tokenIn, tokenOut],
      protocols: ['Uniswap V3'], estimatedOutput: (baseOutput * variance() * 0.999).toFixed(6),
      priceImpact: 0.18, estimatedGasUsd: 3.20, estimatedTime: 15,
      minimumOutput: (baseOutput * 0.994).toFixed(6), isBest: false,
    },
    {
      aggregator: '1inch', aggregatorName: '1inch', path: [tokenIn, 'WETH', tokenOut],
      protocols: ['Uniswap V2', 'Curve'], estimatedOutput: (baseOutput * variance() * 0.997).toFixed(6),
      priceImpact: 0.22, estimatedGasUsd: 3.80, estimatedTime: 20,
      minimumOutput: (baseOutput * 0.992).toFixed(6), isBest: false,
    },
  ]

  // Mark best route
  routes.sort((a, b) => parseFloat(b.estimatedOutput) - parseFloat(a.estimatedOutput))
  routes.forEach((r, i) => { r.isBest = i === 0 })
  return routes
}

// --- Perp positions ---

export const mockPerpPositions: Record<string, PerpPosition[]> = {
  arbitrum: [
    {
      protocol: 'hyperliquid', pair: 'BTC/USD', side: 'long', size: '0.5',
      entryPrice: '95000', markPrice: '97500', leverage: 5,
      unrealizedPnl: '1250', unrealizedPnlPercent: 13.16,
      liquidationPrice: '76000', margin: '9500',
    },
    {
      protocol: 'gmx', pair: 'ETH/USD', side: 'short', size: '10',
      entryPrice: '3500', markPrice: '3450', leverage: 3,
      unrealizedPnl: '500', unrealizedPnlPercent: 4.29,
      liquidationPrice: '4550', margin: '11667',
    },
  ],
  solana: [
    {
      protocol: 'jupiter_perps', pair: 'SOL/USD', side: 'long', size: '100',
      entryPrice: '180', markPrice: '185', leverage: 10,
      unrealizedPnl: '500', unrealizedPnlPercent: 27.78,
      liquidationPrice: '162', margin: '1800',
    },
  ],
}

// --- Funding rates ---

export const mockFundingRates: Record<string, FundingRate[]> = {
  arbitrum: [
    { pair: 'BTC/USD', rate: '0.0045', nextFundingTime: Date.now() + 3600000, protocol: 'hyperliquid' },
    { pair: 'ETH/USD', rate: '-0.0012', nextFundingTime: Date.now() + 3600000, protocol: 'hyperliquid' },
    { pair: 'BTC/USD', rate: '0.0038', nextFundingTime: Date.now() + 7200000, protocol: 'gmx' },
    { pair: 'ETH/USD', rate: '0.0021', nextFundingTime: Date.now() + 7200000, protocol: 'gmx' },
  ],
  solana: [
    { pair: 'BTC/USD', rate: '0.0052', nextFundingTime: Date.now() + 3600000, protocol: 'jupiter_perps' },
    { pair: 'ETH/USD', rate: '0.0018', nextFundingTime: Date.now() + 3600000, protocol: 'jupiter_perps' },
    { pair: 'SOL/USD', rate: '0.0065', nextFundingTime: Date.now() + 3600000, protocol: 'jupiter_perps' },
  ],
}

// --- Gas prices ---

export const mockGasPrices: Record<string, { low: number; medium: number; high: number; unit: string }> = {
  ethereum: { low: 15, medium: 25, high: 40, unit: 'gwei' },
  arbitrum: { low: 0.1, medium: 0.2, high: 0.5, unit: 'gwei' },
  base: { low: 0.005, medium: 0.01, high: 0.02, unit: 'gwei' },
  bsc: { low: 1, medium: 3, high: 5, unit: 'gwei' },
  polygon: { low: 30, medium: 50, high: 80, unit: 'gwei' },
  optimism: { low: 0.005, medium: 0.01, high: 0.02, unit: 'gwei' },
  solana: { low: 5000, medium: 10000, high: 50000, unit: 'microlamports' },
}

// --- Supported aggregators per chain ---

export const mockSupportedProtocols: Record<string, string[]> = {
  ethereum: ['LI.FI', '0x', '1inch', 'Uniswap', 'SushiSwap', 'Curve'],
  arbitrum: ['LI.FI', '0x', '1inch', 'Uniswap', 'SushiSwap', 'Camelot'],
  base: ['LI.FI', '0x', 'Uniswap', 'Aerodrome'],
  bsc: ['LI.FI', '0x', '1inch', 'PancakeSwap'],
  polygon: ['LI.FI', '0x', '1inch', 'QuickSwap', 'Uniswap'],
  optimism: ['LI.FI', '0x', '1inch', 'Velodrome', 'Uniswap'],
  solana: ['Jupiter', 'Raydium', 'Orca'],
}

// --- Perp protocol availability per chain ---

export const mockPerpProtocols: Record<string, PerpProtocolId[]> = {
  arbitrum: ['hyperliquid', 'gmx'],
  solana: ['jupiter_perps'],
}
