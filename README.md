# AuraVerse — NFT Marketplace with Auctions

A full-stack Web3 NFT marketplace built with Solidity, Hardhat, React, and ethers.js. Supports minting, fixed-price listings, timed auctions, royalties (ERC-2981), and IPFS metadata via Pinata.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, OpenZeppelin 5.x |
| Dev Framework | Hardhat |
| Frontend | React 18, Vite, Framer Motion |
| Blockchain | ethers.js v6 |
| Storage | Pinata (IPFS) |
| Network | Ethereum Sepolia Testnet |

## Contracts

- **NFTCollection** — ERC-721 with URI storage, enumerable, royalties (ERC-2981)
- **NFTMarketplace** — Fixed-price listings, buy, cancel, update price, platform fee + royalty distribution
- **NFTAuction** — Timed auctions with bidding, auto-extend, escrow, royalty support

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Free accounts at [Alchemy](https://www.alchemy.com/) and [Pinata](https://www.pinata.cloud/)

### 1. Clone & Install

```bash
git clone https://github.com/arywk40-hue/AYA.git
cd AYA
npm install
cd frontend && npm install && cd ..
```

### 2. Set Up Environment Variables

**Root `.env`** (for Hardhat / contract deployment):
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
```

**`frontend/.env`** (for IPFS uploads):
```
VITE_PINATA_JWT=your_pinata_jwt_token
```

### 3. Compile & Test Contracts

```bash
npm run compile
npm run test
```

### 4. Deploy Contracts to Sepolia

```bash
npm run deploy:sepolia
```

This automatically updates `frontend/src/utils/constants.js` with the new contract addresses.

### 5. Run the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in a browser with MetaMask connected to Sepolia.

### 6. Deploy Frontend to Vercel

```bash
cd frontend
npx vercel --prod
```

Or connect the GitHub repo to [vercel.com](https://vercel.com) and set:
- **Root Directory**: `frontend`
- **Environment Variable**: `VITE_PINATA_JWT`

## Features

- 🎨 **Mint NFTs** — Upload image → IPFS → mint on-chain
- 🏷️ **Fixed-Price Listings** — List, buy, cancel, update price
- ⏱️ **Timed Auctions** — Bid, auto-extend, end, cancel, withdraw
- 💰 **Royalties** — ERC-2981, auto-paid on every sale
- 🔗 **Wallet Connect** — MetaMask, network detection & switching
- 🌌 **Animated UI** — Particles, 3D card tilt, mask text, glassmorphism

## Project Structure

```
├── contracts/          # Solidity smart contracts
├── scripts/            # Hardhat deploy script (auto-updates frontend)
├── test/               # Contract tests (Chai + Hardhat)
├── frontend/
│   ├── src/
│   │   ├── components/ # Navbar, Footer, NFTCard, AuctionTimer, etc.
│   │   ├── context/    # Web3Context (wallet state)
│   │   ├── hooks/      # useContracts (all contract interactions)
│   │   ├── pages/      # Home, Explore, Create, NFTDetail, Profile
│   │   └── utils/      # constants, helpers, ipfs upload
│   └── vercel.json     # Vercel deployment config
└── hardhat.config.js
```

## License

MIT