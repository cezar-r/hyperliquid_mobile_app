---
name: hyperliquid-api
description: Fetches official Hyperliquid API documentation on-demand. Use when answering questions about Hyperliquid API endpoints, websockets, signing, order placement, info queries, exchange actions, rate limits, or any HL API implementation details. Triggers on Hyperliquid API questions.
allowed-tools: WebFetch, Read
---

# Hyperliquid API Documentation Fetcher

This skill fetches the official Hyperliquid API documentation to ensure accurate, up-to-date answers.

## URL Mapping

Based on the query topic, fetch the appropriate documentation:

| Topic | URL |
|-------|-----|
| **General API overview** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api |
| **Notation / data formats** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/notation |
| **Asset IDs / coin indices** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids |
| **Tick size / lot size / precision** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size |
| **Nonces / API wallets** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets |
| **Info endpoint (general)** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint |
| **Info endpoint - perpetuals** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals |
| **Info endpoint - spot** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/spot |
| **Exchange endpoint / order placement** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint |
| **WebSocket (general)** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket |
| **WebSocket subscriptions** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions |
| **WebSocket post requests** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/post-requests |
| **WebSocket timeouts / heartbeats** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/timeouts-and-heartbeats |
| **Error responses** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/error-responses |
| **Signing / authentication** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing |
| **Rate limits** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits |
| **Activation gas fee** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/activation-gas-fee |
| **Bridge2** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2 |
| **HIP-3 Overview** | https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals |
| **HIP-3 Deployer Actions** | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-3-deployer-actions |

## Instructions

1. **Identify the topic(s)** from the user's question
2. **Fetch only the relevant URL(s)** using WebFetch - do NOT fetch all docs
3. **Extract the specific information** needed to answer the question
4. **Cite the source** when providing the answer

## Examples

**User asks about order types or placing orders:**
- Fetch: Exchange endpoint URL

**User asks about WebSocket subscriptions:**
- Fetch: WebSocket subscriptions URL (and possibly general WebSocket URL if needed)

**User asks about getting market data:**
- Fetch: Info endpoint - perpetuals (for perps) or Info endpoint - spot (for spot)

**User asks about authentication or signing:**
- Fetch: Signing URL

## Important

- Only fetch what's needed - don't fetch multiple docs unless the question spans topics
- If the question is ambiguous, start with the most likely doc and fetch more if needed
- Always prefer official documentation over assumptions
