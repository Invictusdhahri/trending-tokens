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

export async function getTrendingPools(): Promise<SimplifiedPoolInfo[]> {
  const response = await fetch(
    'https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?include=included&page=1&duration=24h',
    {
      headers: {
        'accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch trending pools');
  }

  const data: TrendingPoolsResponse = await response.json();
  
  return Promise.all(data.data
    .filter(pool => {
      const liquidity = parseFloat(pool.attributes.reserve_in_usd || '0');
      return liquidity >= 1000;
    })
    .map(async pool => {
      const poolName = pool.attributes.name || '';
      const [baseToken, quoteToken] = poolName.split('/');
      const coinName = pool.attributes.base_token_name || baseToken || 'Unknown';
      const marketCap = pool.attributes.market_cap_usd || pool.attributes.fdv_usd || '0';
      const dexId = pool.relationships?.dex?.data?.id || '';
      let dexName = getDexName(dexId);
      const tokenAddress = pool.attributes.base_token_address || pool.relationships?.base_token?.data?.id?.replace('solana_', '') || '';
      
      // Fetch token info including image and holders
      let imageUrl = '';
      let holdersCount = 0;
      
      try {
        const tokenInfoResponse = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${tokenAddress}/info`,
          {
            headers: {
              'accept': 'application/json'
            }
          }
        );
        
        if (tokenInfoResponse.ok) {
          const tokenInfo: TokenInfo = await tokenInfoResponse.json();
          imageUrl = tokenInfo.data.attributes.image_url || '';
          holdersCount = tokenInfo.data.attributes.holders?.count || 0;
        }
      } catch (error) {
        console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
      }
      
      return {
        coin_name: coinName,
        coin_price: pool.attributes.base_token_price_usd || '0',
        market_cap: marketCap,
        volume_24h: pool.attributes.volume_usd?.h24 || '0',
        dex_name: dexName,
        liquidity: pool.attributes.reserve_in_usd || '0',
        token_address: tokenAddress,
        image_url: imageUrl,
        holders: holdersCount
      };
    }));
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

// Run the main function
main();

export default getTrendingPools;