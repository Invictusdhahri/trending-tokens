# Trending Tokens

A TypeScript-based tool to fetch and monitor trending token pools on Solana blockchain using the GeckoTerminal API.

## Features

- Fetches trending token pools from Solana network
- Filters pools by minimum liquidity ($1000)
- Provides detailed information for each pool:
  - Coin name
  - Current price
  - Market cap
  - 24h trading volume
  - DEX name (supports multiple Solana DEXes)
  - Liquidity
  - Token address

## Example

Example output:
![Example Output](./example.png)

You can also see a sample JSON response:
```json
{
  "coin_name": "BONK",
  "coin_price": "0.000012345",
  "market_cap": "1234567",
  "volume_24h": "987654",
  "dex_name": "Raydium",
  "liquidity": "500000",
  "token_address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
}
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Invictusdhahri/trending-tokens.git