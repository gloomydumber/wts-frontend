import { fetchMarketData } from '../../../services/MarketDataClient'
import { MOCK_SEARCH_RESULTS } from './mockData'
import type { CoinGeckoSearchResult, CoinGeckoDetail } from './types'

const BASE = 'https://api.coingecko.com/api/v3'

interface SearchResponse {
  coins: CoinGeckoSearchResult[]
}

/**
 * Search CoinGecko for coins by name/symbol.
 * Falls back to mock results if CORS-blocked or rate-limited.
 */
export async function searchCoins(query: string): Promise<CoinGeckoSearchResult[]> {
  if (!query.trim()) return []
  try {
    const data = await fetchMarketData<SearchResponse>(
      `${BASE}/search?query=${encodeURIComponent(query)}`,
      60_000, // 1 min cache for search
    )
    return (data.coins || []).slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      thumb: c.thumb,
      market_cap_rank: c.market_cap_rank,
    }))
  } catch {
    // CORS blocked or rate-limited — return mock
    const q = query.toLowerCase()
    return MOCK_SEARCH_RESULTS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
    )
  }
}

/**
 * Fetch coin detail from CoinGecko.
 * Returns null on failure (caller should use manual entry).
 */
export async function fetchCoinDetail(coingeckoId: string): Promise<CoinGeckoDetail | null> {
  try {
    const data = await fetchMarketData<CoinGeckoDetail>(
      `${BASE}/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      5 * 60_000, // 5 min cache
    )
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      platforms: data.platforms || {},
      market_data: {
        fully_diluted_valuation: data.market_data?.fully_diluted_valuation || { usd: null },
        market_cap: data.market_data?.market_cap || { usd: null },
        current_price: data.market_data?.current_price || { usd: null },
        total_supply: data.market_data?.total_supply ?? null,
        circulating_supply: data.market_data?.circulating_supply ?? null,
      },
    }
  } catch {
    return null
  }
}
