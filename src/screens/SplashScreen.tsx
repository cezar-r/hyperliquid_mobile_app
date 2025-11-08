// import React, { useEffect, useRef } from 'react';
// import { View, Image } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { useAccount } from '@reown/appkit-react-native';
// import { loadSessionKey } from '../lib/sessionKey';
// import { useWallet } from '../contexts/WalletContext';
// import { styles } from './styles/SplashScreen.styles';

// type NavigationProp = NativeStackNavigationProp<any>;

// export default function SplashScreen(): React.JSX.Element {
//   const navigation = useNavigation<NavigationProp>();
//   const { address, isConnected } = useAccount();
//   const { account } = useWallet();
//   const hasNavigated = useRef(false);
//   const startTime = useRef(Date.now());
//   const checkTimeout = useRef<NodeJS.Timeout | null>(null);

//   useEffect(() => {
//     // Wait a full second to let the wallet connection state fully initialize
//     checkTimeout.current = setTimeout(async () => {
//       if (hasNavigated.current) return;

//       console.log('[SplashScreen] Connection check - isConnected:', isConnected, 'address:', address);

//       // Ensure minimum 1 second display time
//       const elapsed = Date.now() - startTime.current;
//       const minDisplayTime = 1000;
//       const additionalWait = Math.max(0, minDisplayTime - elapsed);

//       if (additionalWait > 0) {
//         await new Promise(resolve => setTimeout(resolve, additionalWait));
//       }

//       if (hasNavigated.current) return;

//       // NOT CONNECTED - go to Connect screen
//       if (!isConnected || !address) {
//         console.log('[SplashScreen] Not connected, navigating to Connect');
//         hasNavigated.current = true;
//         navigation.replace('Connect');
//         return;
//       }

//       // CONNECTED - check for session key
//       try {
//         const sessionKey = await loadSessionKey();
        
//         if (!sessionKey) {
//           // Connected but no session key - go to EnableSessionKey
//           console.log('[SplashScreen] Connected but no session key, navigating to EnableSessionKey');
//           hasNavigated.current = true;
//           navigation.replace('EnableSessionKey');
//           return;
//         }

//         // HAS SESSION KEY - wait for account data before going to home
//         console.log('[SplashScreen] Has session key, waiting for account data...');
        
//         // Wait for account data to load (up to 5 seconds)
//         const maxWaitForData = 5000;
//         const dataStartTime = Date.now();
        
//         const checkAccountData = () => {
//           if (hasNavigated.current) return;
          
//           const waitedForData = Date.now() - dataStartTime;
          
//           // If we have data OR we've waited too long, navigate
//           if (account.data !== null || waitedForData > maxWaitForData) {
//             console.log('[SplashScreen] Account data ready, navigating to home');
//             hasNavigated.current = true;
//             navigation.replace('Authenticated', { screen: 'Tabs' });
//           } else {
//             // Check again in 200ms
//             setTimeout(checkAccountData, 200);
//           }
//         };
        
//         checkAccountData();
        
//       } catch (error) {
//         console.error('[SplashScreen] Error checking session key:', error);
//         hasNavigated.current = true;
//         navigation.replace('Connect');
//       }
//     }, 1000); // Wait 1 full second before checking anything

//     return () => {
//       if (checkTimeout.current) {
//         clearTimeout(checkTimeout.current);
//       }
//     };
//   }, [isConnected, address, account.data, navigation]);

//   return (
//     <View style={styles.container}>
//       <Image
//         source={require('../../assets/blob_green.gif')}
//         style={styles.loadingGif}
//         resizeMode="contain"
//       />
//     </View>
//   );
// }

