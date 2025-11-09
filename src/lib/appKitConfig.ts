import '@walletconnect/react-native-compat';
import { createAppKit } from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import { mainnet, arbitrum } from 'viem/chains';
import * as Clipboard from 'expo-clipboard';
import { storage } from './storage';
import { WALLETCONNECT_PROJECT_ID } from '@env';

const projectId = WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

const ethersAdapter = new EthersAdapter();

export const appKit = createAppKit({
  projectId,
  networks: [mainnet, arbitrum],
  defaultNetwork: mainnet,
  adapters: [ethersAdapter],
  storage,
  metadata: {
    name: 'Hyperliquid',
    description: 'Mobile companion for Hyperliquid',
    url: 'https://hyperliquid.xyz',
    icons: ['https://hyperliquid.xyz/favicon.ico'],
    redirect: {
      native: 'hyperliquidmobile://',
      universal: 'https://hyperliquid.xyz',
    },
  },
  clipboardClient: {
    setString: async (value: string) => {
      await Clipboard.setStringAsync(value);
    },
  },
  features: {
    socials: false,
    swaps: false,
    onramp: false,
    showWallets: true,
  },
  themeMode: 'dark',
  debug: true,
});

