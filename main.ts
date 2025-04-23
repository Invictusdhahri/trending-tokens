import fetch from 'cross-fetch';

interface TrendingPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    volume_usd: {
      h24: string;
    };
    price_change_percentage: {
      h24: string;
    };
  };
}

interface TrendingPoolsResponse {
  data: TrendingPool[];
}

export async function getTrendingPools(): Promise<TrendingPoolsResponse> {
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

  return response.json();
}

// Self-executing function to run the code
async function main() {
  try {
    const pools = await getTrendingPools();
    console.log('Trending Pools:', JSON.stringify(pools, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();

export default getTrendingPools;