---
name: hl-api-samples
description: Generates bash/curl commands for fetching sample data from Hyperliquid API. Use when user wants curl examples, bash commands to test the API, or sample data fetch commands for mainnet.
allowed-tools:
---

# Hyperliquid API Sample Data Fetcher

Generate ready-to-run bash/curl commands for fetching data from the Hyperliquid mainnet API.

## Base URL

```
https://api.hyperliquid.xyz/info
```

All requests are POST with `Content-Type: application/json`.

---

## Public Data Commands

### Get Exchange Metadata (assets, leverage, decimals)
```bash
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "meta"}' | jq
```

### Get All Mid Prices
```bash
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "allMids"}' | jq
```

### Get Meta + Asset Contexts (combined metadata)
```bash
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "metaAndAssetCtxs"}' | jq
```

### Get Order Book (L2)
```bash
# BTC order book
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "l2Book", "coin": "BTC"}' | jq

# ETH order book
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "l2Book", "coin": "ETH"}' | jq

# SOL order book
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "l2Book", "coin": "SOL"}' | jq
```

### Get Recent Trades
```bash
# BTC recent trades
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "recentTrades", "coin": "BTC"}' | jq

# ETH recent trades
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "recentTrades", "coin": "ETH"}' | jq
```

### Get Candle Data (OHLCV)
```bash
# BTC 1-hour candles (last 24 hours)
# Replace START_TIME and END_TIME with millisecond timestamps
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "candleSnapshot", "req": {"coin": "BTC", "interval": "1h", "startTime": 1704067200000, "endTime": 1704153600000}}' | jq

# ETH 15-minute candles
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "candleSnapshot", "req": {"coin": "ETH", "interval": "15m", "startTime": 1704067200000, "endTime": 1704153600000}}' | jq
```

**Candle Intervals**: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`

---

## User-Specific Commands

Replace `0xYOUR_ADDRESS` with your actual wallet address.

### Get Account State (positions, margin, balance)
```bash
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "clearinghouseState", "user": "0xYOUR_ADDRESS"}' | jq
```

### Get Open Orders
```bash
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "openOrders", "user": "0xYOUR_ADDRESS"}' | jq
```

### Get Trade Fills (history)
```bash
# Get fills from a start time (milliseconds)
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "userFills", "user": "0xYOUR_ADDRESS", "startTime": 1704067200000}' | jq
```

### Get Funding Payments
```bash
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "userFunding", "user": "0xYOUR_ADDRESS", "startTime": 1704067200000}' | jq
```

---

## Tips

- **Formatting**: Pipe output to `jq` for pretty-printed JSON
- **Timestamps**: All times are in milliseconds (e.g., `Date.now()` in JS, `date +%s000` in bash)
- **Get current timestamp**: `date +%s000`
- **Get timestamp from 24h ago**: `echo $(($(date +%s) - 86400))000`
- **Asset names**: Use symbols like `BTC`, `ETH`, `SOL`, `HYPE` (see `meta` endpoint for full list)
