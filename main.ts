import fetch from 'cross-fetch';

interface TrendingPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    base_token_name: string;
    base_token_symbol: string;
    quote_token_name: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    volume_usd: {
      h24: string;
    };
    price_change_percentage: {
      h24: string;
    };
    market_cap_usd: string;
    dex_id: string;
    base_token_address: string;
    pool_address: string;
    fdv_usd: string;
    reserve_in_usd: string;
  };
  relationships: {
    base_token: {
      data: {
        id: string;
        type: string;
      };
    };
    dex: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface TokenInfo {
  data: {
    attributes: {
      image_url: string;
      holders: {
        count: number;
      };
    };
  };
}

interface SimplifiedPoolInfo {
  coin_name: string;
  coin_price: string;
  market_cap: string;
  volume_24h: string;
  dex_name: string;
  liquidity: string;
  token_address: string;
  image_url: string;
  holders: number;
}

interface TrendingPoolsResponse {
  data: TrendingPool[];
  included?: any[];
}

// Cache for token info to avoid redundant API calls
const tokenInfoCache: Map<string, { imageUrl: string; holders: number }> = new Map();

export async function getTrendingPools(): Promise<SimplifiedPoolInfo[]> {
  try {
    const response = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?include=included&page=1&duration=24h',
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trending pools: ${response.status}`);
    }

    const data: TrendingPoolsResponse = await response.json();
    
    // Process pools in parallel with a limit of 5 concurrent requests
    const batchSize = 5;
    const results: SimplifiedPoolInfo[] = [];
    const filteredPools = data.data.filter(pool => 
      parseFloat(pool.attributes.reserve_in_usd || '0') >= 1000
    );

    for (let i = 0; i < filteredPools.length; i += batchSize) {
      const batch = filteredPools.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processPool));
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error('Error fetching trending pools:', error);
    throw error;
  }
}

async function processPool(pool: TrendingPool): Promise<SimplifiedPoolInfo> {
  const poolName = pool.attributes.name || '';
  const [baseToken] = poolName.split('/');
  const coinName = pool.attributes.base_token_name || baseToken || 'Unknown';
  const marketCap = pool.attributes.market_cap_usd || pool.attributes.fdv_usd || '0';
  const dexId = pool.relationships?.dex?.data?.id || '';
  const dexName = getDexName(dexId);
  const tokenAddress = pool.attributes.base_token_address || 
    pool.relationships?.base_token?.data?.id?.replace('solana_', '') || '';

  let tokenInfo = tokenInfoCache.get(tokenAddress);

  if (!tokenInfo) {
    tokenInfo = await fetchTokenInfo(tokenAddress);
    tokenInfoCache.set(tokenAddress, tokenInfo);
  }

  return {
    coin_name: coinName,
    coin_price: pool.attributes.base_token_price_usd || '0',
    market_cap: marketCap,
    volume_24h: pool.attributes.volume_usd?.h24 || '0',
    dex_name: dexName,
    liquidity: pool.attributes.reserve_in_usd || '0',
    token_address: tokenAddress,
    image_url: tokenInfo.imageUrl,
    holders: tokenInfo.holders
  };
}

async function fetchTokenInfo(tokenAddress: string): Promise<{ imageUrl: string; holders: number }> {
  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${tokenAddress}/info`,
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      return { imageUrl: '', holders: 0 };
    }

    const tokenInfo: TokenInfo = await response.json();
    return {
      imageUrl: tokenInfo.data.attributes.image_url || '',
      holders: tokenInfo.data.attributes.holders?.count || 0
    };
  } catch (error) {
    console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
    return { imageUrl: '', holders: 0 };
  }
}

function getDexName(dexId: string): string {
  if (!dexId) return 'Unknown';

  const dexNames: { [key: string]: string } = {
    'raydium': 'Raydium',
    'orca': 'Orca',
    'jupiter': 'Jupiter',
    'marinade': 'Marinade',
    'saber': 'Saber',
    'openbook': 'OpenBook',
    'aldrin': 'Aldrin',
    'serum': 'Serum',
    'lifinity': 'Lifinity',
    'cropper': 'Cropper',
    'dexlab': 'Dexlab',
    'step': 'Step',
    'atrix': 'Atrix',
    'phoenix': 'Phoenix',
    'meteora': 'Meteora',
    'invariant': 'Invariant',
    'balansol': 'Balansol',
    'crema': 'Crema',
    'tensor': 'Tensor',
    'dradex': 'DraDex',
    'saros': 'Saros',
    'cykura': 'Cykura',
    'penguin': 'Penguin',
    'goosefx': 'GooseFX',
    'symmetry': 'Symmetry',
    'mercurial': 'Mercurial',
    'mango': 'Mango',
    'drift': 'Drift',
    // Add common variations
    'raydium-v3': 'Raydium',
    'orca-v2': 'Orca',
    'raydiumv3': 'Raydium',
    'orcav2': 'Orca'
  };

  const normalizedDexId = dexId.toLowerCase().trim();
  // console.log('Normalized DEX ID:', normalizedDexId);
  
  // Try exact match first
  if (dexNames[normalizedDexId]) {
    return dexNames[normalizedDexId];
  }
  
  // Try matching without version numbers and special characters
  const cleanDexId = normalizedDexId.replace(/[^a-z]/g, '');
  if (dexNames[cleanDexId]) {
    return dexNames[cleanDexId];
  }
  
  // If no match found, return the original ID
  return dexId || 'Unknown';
}

// Self-executing function to run the code
async function main() {
  try {
    const pools = await getTrendingPools();
    console.log(JSON.stringify(pools, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

export default getTrendingPools;