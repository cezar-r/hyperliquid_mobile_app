# Hyperliquid Mobile Companion

A React Native mobile application for interacting with the Hyperliquid decentralized exchange.


---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **macOS** (required for iOS builds)
- **Node.js 18+** and npm
- **Git**
- **Xcode** (latest version from Mac App Store)
- **Xcode Command Line Tools**: `xcode-select --install`

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/hyperliquid-mobile-companion.git
cd hyperliquid-mobile-companion
```

### Step 2: Install Global Dependencies

```bash
# Install Expo CLI
npm install -g @expo/cli

# Install EAS CLI (for building and submitting to TestFlight)
npm install -g eas-cli
```

### Step 3: Install Project Dependencies

```bash
npm install
```

### Step 4: Set Up WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### Step 5: Configure Environment Variables

Create a `.env` file in the project root:

```env
WALLETCONNECT_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_HL_ENV=testnet
# EXPO_PUBLIC_HL_API_URL=  # Optional override
```

Replace `your_project_id_here` with your actual WalletConnect Project ID.

### Step 6: Running the App Locally

Test the app in development before building:

```bash
# Start development server
npx expo start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

---

## Development

### Code Quality Tools

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Deploying to TestFlight

Ready to deploy your app to TestFlight for beta testing? See the comprehensive deployment guide:

**[Deployment Guide](docs/DEPLOYMENT.md)**

This guide covers:
- Prerequisites and account setup
- Step-by-step deployment process
- Updating builds
- Troubleshooting common issues
- Commands reference

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Core Documentation

- **[FEATURES.md](docs/FEATURES.md)** - Complete feature list and descriptions
  
- **[STACK.md](docs/STACK.md)** - Technology stack and dependencies

- **[PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** - Codebase organization

- **[CODE_STYLE.md](docs/CODE_STYLE.md)** - Coding standards and conventions

### App Guide

- **[APP_SCREENS.md](docs/APP_SCREENS.md)** - Detailed tour of all app screens

- **[ARCHITECTURE_HIGHLIGHTS.md](docs/ARCHITECTURE_HIGHLIGHTS.md)** - Technical architecture

---

## Quick Links

- **Features**: [FEATURES.md](docs/FEATURES.md)
- **Tech Stack**: [STACK.md](docs/STACK.md)
- **Project Structure**: [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
- **Code Style**: [CODE_STYLE.md](docs/CODE_STYLE.md)
- **App Screens**: [APP_SCREENS.md](docs/APP_SCREENS.md)
- **Architecture**: [ARCHITECTURE_HIGHLIGHTS.md](docs/ARCHITECTURE_HIGHLIGHTS.md)
- **Deployment**: [DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## License

MIT License - See [LICENSE.md](LICENSE.md) for details.

This project is open source and free to use, modify, and distribute. You may fork this project, modify it, and publish your own version.

---

## ⚠️ DISCLAIMER

**IMPORTANT: READ CAREFULLY BEFORE USING THIS SOFTWARE**

### Financial Risk Warning

This software is provided for educational and informational purposes only. Trading cryptocurrencies, perpetual contracts, and other digital assets involves substantial risk of loss and is not suitable for every investor. The valuation of cryptocurrencies and tokens may fluctuate, and, as a result, you may lose more than your original investment.

**By using this software, you acknowledge and agree that:**

1. **No Financial Advice**: This software does not provide financial, investment, trading, or other advice. Any decisions you make based on information provided by this software are your sole responsibility.

2. **Use at Your Own Risk**: You use this software entirely at your own risk. The developers and contributors of this software shall not be liable for any losses, damages, costs, or expenses incurred as a result of using this software.

3. **No Warranty**: This software is provided "as is" without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.

4. **No Liability for Losses**: The developers, contributors, and anyone who deploys or distributes this code are NOT responsible for any funds gained or lost, trading decisions made, or financial outcomes resulting from the use of this software.

5. **Smart Contract Risks**: Interacting with blockchain protocols and smart contracts carries inherent risks including but not limited to smart contract bugs, protocol vulnerabilities, network congestion, and loss of private keys.

6. **Regulatory Compliance**: You are solely responsible for ensuring your use of this software complies with all applicable laws and regulations in your jurisdiction. Cryptocurrency trading and DeFi activities may be subject to licensing requirements, tax obligations, and other legal restrictions.

7. **Security Risks**: While security best practices have been followed, no software is completely secure. You are responsible for securing your device, private keys, and wallet credentials.

8. **Third-Party Services**: This software integrates with third-party services (Hyperliquid, WalletConnect, blockchain networks, etc.). The developers of this software are not responsible for the actions, security, or availability of these third-party services.

9. **No Guarantee of Availability**: This software may contain bugs, errors, or may become unavailable at any time. There is no guarantee of uptime, accuracy, or continued functionality.

10. **Personal Responsibility**: You are solely responsible for:
    - Conducting your own research before making any trading decisions
    - Understanding the risks involved in cryptocurrency trading
    - Securing your wallet and private keys
    - Complying with all applicable laws and regulations
    - Managing your own risk and position sizing
    - Any tax obligations resulting from your trading activity

### No Endorsement

This software is an independent, community-built project. It is not officially endorsed, affiliated with, or supported by Hyperliquid Labs, the Hyperliquid Foundation, or any other organization mentioned in this software.

### Modifications and Forks

Anyone who forks, modifies, or deploys this code assumes full responsibility for their version of the software and any consequences arising from its use. The original developers bear no responsibility for modifications made by third parties.

---

**BY USING THIS SOFTWARE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS DISCLAIMER. IF YOU DO NOT AGREE WITH THESE TERMS, DO NOT USE THIS SOFTWARE.**
