import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { logScreenMount, logScreenUnmount, logUserAction } from '../../../lib/logger';
import { Color } from '../../shared/styles';
import { styles } from './styles/BrowserScreen.styles';

const DEFAULT_URL = 'https://app.hyperliquid.xyz';

// Dark mode injection script
const getDarkModeScript = () => `
  (function() {
    // Add meta tag for color-scheme preference
    const metaTag = document.createElement('meta');
    metaTag.name = 'color-scheme';
    metaTag.content = 'dark';
    document.head.appendChild(metaTag);
    
    // Apply dark mode styles
    const style = document.createElement('style');
    style.textContent = \`
      :root {
        color-scheme: dark;
      }
      
      @media (prefers-color-scheme: light) {
        :root {
          color-scheme: dark !important;
        }
      }
    \`;
    document.head.appendChild(style);
  })();
`;

// Web3 Provider injection script with proper bridging
const getWeb3ProviderScript = (walletAddress: string, chainId: number) => `
  (function() {
    // Send message to RN for debugging (since console doesn't work on iOS)
    const logToRN = (msg) => {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'debug_log',
          message: msg
        }));
      } catch (e) {}
    };
    
    logToRN('[Web3 Provider] 🚀 Injection starting...');
    logToRN('[Web3 Provider] Address: ${walletAddress}');
    logToRN('[Web3 Provider] Chain ID: ${chainId}');
    
    let requestId = 0;
    const pendingRequests = new Map();
    
    // Listen for responses from React Native
    window.addEventListener('message', (event) => {
      console.log('[Web3 Provider] Received message from RN:', event.data);
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.type === 'eth_response' && data.id !== undefined) {
        console.log('[Web3 Provider] Processing response for request:', data.id);
        const resolver = pendingRequests.get(data.id);
        if (resolver) {
          if (data.error) {
            console.error('[Web3 Provider] Request failed:', data.error);
            resolver.reject(new Error(data.error));
          } else {
            console.log('[Web3 Provider] Request succeeded:', data.result);
            resolver.resolve(data.result);
          }
          pendingRequests.delete(data.id);
        } else {
          console.warn('[Web3 Provider] No pending request found for ID:', data.id);
        }
      }
    });
    
    // Create Ethereum provider that bridges to your actual connected wallet
    window.ethereum = {
      // Identify as MetaMask for maximum compatibility
      isMetaMask: true,
      isMobile: true,
      _metamask: {
        isUnlocked: () => Promise.resolve(true),
      },
      chainId: '0x${chainId.toString(16)}',
      networkVersion: '${chainId}',
      selectedAddress: '${walletAddress}',
      isConnected: () => true,
      _state: {
        accounts: ['${walletAddress}'],
        isConnected: true,
        isUnlocked: true,
        initialized: true,
      },
      _events: {},
      _eventsCount: 0,
      
      request: async ({ method, params = [] }) => {
        logToRN('[Web3 Provider] 📞 Request: ' + method);
        
        // Handle account requests
        if (method === 'eth_accounts') {
          logToRN('[Web3 Provider] ✅ Returning accounts');
          return ['${walletAddress}'];
        }
        
        if (method === 'eth_requestAccounts') {
          logToRN('[Web3 Provider] 🔗 Connection requested!');
          
          // Emit accountsChanged event to notify dApp
          if (window.ethereum._callbacks && window.ethereum._callbacks.accountsChanged) {
            logToRN('[Web3 Provider] Firing accountsChanged callbacks');
            window.ethereum._callbacks.accountsChanged.forEach(cb => {
              try {
                cb(['${walletAddress}']);
              } catch (e) {
                logToRN('[Web3 Provider] ❌ Error in callback: ' + e.message);
              }
            });
          }
          
          return ['${walletAddress}'];
        }
        
        if (method === 'eth_chainId') {
          console.log('[Web3 Provider] Returning chain ID:', '0x${chainId.toString(16)}');
          return '0x${chainId.toString(16)}';
        }
        if (method === 'net_version') {
          console.log('[Web3 Provider] Returning network version:', '${chainId}');
          return '${chainId}';
        }
        
        // Handle wallet_switchEthereumChain and wallet_addEthereumChain locally
        if (method === 'wallet_switchEthereumChain') {
          console.log('[Web3 Provider] Ignoring chain switch request (already on correct chain)');
          return null;
        }
        
        if (method === 'wallet_addEthereumChain') {
          console.log('[Web3 Provider] Ignoring add chain request');
          return null;
        }
        
        // Handle wallet permissions
        if (method === 'wallet_requestPermissions' || method === 'wallet_getPermissions') {
          console.log('[Web3 Provider] Granting permissions');
          return [{
            invoker: 'https://app.uniswap.org',
            parentCapability: 'eth_accounts',
            caveats: [
              {
                type: 'filterResponse',
                value: ['${walletAddress}']
              }
            ]
          }];
        }
        
        // For complex requests, bridge to React Native
        const id = requestId++;
        logToRN('[Web3 Provider] 🔄 Bridging request to RN: ' + method);
        
        return new Promise((resolve, reject) => {
          pendingRequests.set(id, { resolve, reject });
          
          const message = JSON.stringify({
            type: 'eth_request',
            id,
            method,
            params
          });
          
          window.ReactNativeWebView.postMessage(message);
          logToRN('[Web3 Provider] Message sent to RN');
          
          // Timeout after 60 seconds
          setTimeout(() => {
            if (pendingRequests.has(id)) {
              console.error('[Web3 Provider] Request timeout for:', method);
              pendingRequests.delete(id);
              reject(new Error('Request timeout'));
            }
          }, 60000);
        });
      },
      
      // Event handling
      on: (event, callback) => {
        console.log('[Ethereum Provider] Event subscription:', event);
        // Store callbacks for later use
        if (!window.ethereum._callbacks) {
          window.ethereum._callbacks = {};
        }
        if (!window.ethereum._callbacks[event]) {
          window.ethereum._callbacks[event] = [];
        }
        window.ethereum._callbacks[event].push(callback);
      },
      
      removeListener: (event, callback) => {
        if (window.ethereum._callbacks && window.ethereum._callbacks[event]) {
          const index = window.ethereum._callbacks[event].indexOf(callback);
          if (index > -1) {
            window.ethereum._callbacks[event].splice(index, 1);
          }
        }
      },
      
      // Legacy methods
      enable: async () => {
        return ['${walletAddress}'];
      },
      
      send: (method, params) => {
        return window.ethereum.request({ method, params });
      },
      
      sendAsync: (payload, callback) => {
        window.ethereum.request({ 
          method: payload.method, 
          params: payload.params 
        }).then(result => {
          callback(null, { result, id: payload.id, jsonrpc: '2.0' });
        }).catch(error => {
          callback(error, null);
        });
      }
    };
    
    // Notify the page that Web3 is ready (multiple events for compatibility)
    console.log('[Web3 Provider] Dispatching wallet detection events');
    
    // Legacy MetaMask event
    window.dispatchEvent(new Event('ethereum#initialized'));
    
    // EIP-6963: Multi Injected Provider Discovery
    // Announce as MetaMask for maximum compatibility
    const announceEvent = new CustomEvent('eip6963:announceProvider', {
      detail: {
        info: {
          uuid: 'io.metamask',
          name: 'MetaMask',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 318.6 318.6"><polygon fill="%23E2761B" points="274.1,35.5 174.6,109.4 193,65.8"/><polygon fill="%23E4761B" points="44.4,35.5 143.1,110.1 125.6,65.8"/><polygon fill="%23E4761B" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/><polygon fill="%23E4761B" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/><polygon fill="%23E4761B" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/><polygon fill="%23E4761B" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"/></svg>',
          rdns: 'io.metamask'
        },
        provider: window.ethereum
      }
    });
    window.dispatchEvent(announceEvent);
    console.log('[Web3 Provider] EIP-6963 announcement sent as MetaMask');
    
    // Emit connect event for existing listeners
    if (window.ethereum._callbacks && window.ethereum._callbacks.connect) {
      console.log('[Web3 Provider] Emitting connect event');
      window.ethereum._callbacks.connect.forEach(cb => {
        cb({ chainId: '0x${chainId.toString(16)}' });
      });
    }
    
    // Also listen for requests from the page
    window.addEventListener('eip6963:requestProvider', () => {
      console.log('[Web3 Provider] Received provider request, announcing again');
      window.dispatchEvent(announceEvent);
    });
    
    // Disable WalletConnect and make our provider the ONLY option
    window.ethereum.providers = [window.ethereum];
    
    // Override WalletConnect detection
    delete window.WalletConnect;
    delete window.WalletConnectProvider;
    
    // Make our provider the default for all common checks
    window.web3 = {
      currentProvider: window.ethereum,
      eth: {
        defaultAccount: '${walletAddress}'
      }
    };
    
    // Override common wallet detection libraries
    Object.defineProperty(window, 'ethereum', {
      value: window.ethereum,
      writable: false,
      configurable: false
    });
    
    logToRN('[Web3 Provider] ✅ Initialization complete!');
    logToRN('[Web3 Provider] window.ethereum.isMetaMask = ' + window.ethereum.isMetaMask);
    logToRN('[Web3 Provider] window.ethereum.selectedAddress = ' + window.ethereum.selectedAddress);
    logToRN('[Web3 Provider] Provider should appear as MetaMask in wallet list');
  })();
`;

// Script to run after page load
const getPostLoadScript = () => `
  (function() {
    const logToRN = (msg) => {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'debug_log',
          message: msg
        }));
      } catch (e) {}
    };
    
    logToRN('[Web3 Provider] 📄 Post-load check running');
    
    // Check if provider is still available
    if (window.ethereum) {
      logToRN('[Web3 Provider] ✓ window.ethereum exists');
      logToRN('[Web3 Provider] ✓ isMetaMask: ' + window.ethereum.isMetaMask);
      logToRN('[Web3 Provider] ✓ selectedAddress: ' + window.ethereum.selectedAddress);
    } else {
      logToRN('[Web3 Provider] ✗ window.ethereum is MISSING!');
    }
  })();
`;

// Combined injection script
const getInjectionScript = (walletAddress: string | undefined, chainId: number) => {
  console.log('[BrowserScreen] Preparing injection script');
  console.log('[BrowserScreen] Wallet address for injection:', walletAddress);
  console.log('[BrowserScreen] Chain ID:', chainId);
  
  const darkModeScript = getDarkModeScript();
  const web3Script = walletAddress ? getWeb3ProviderScript(walletAddress, chainId) : '';
  const combined = darkModeScript + web3Script;
  
  console.log('[BrowserScreen] Injection script length:', combined.length, 'characters');
  return combined;
};

export default function BrowserScreen(): React.JSX.Element {
  const webviewRef = useRef<any>(null);
  const { address } = useAccount();
  const { provider } = useProvider();
  
  const [url, setUrl] = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Screen lifecycle logging
  useEffect(() => {
    logScreenMount('BrowserScreen');
    console.log('[BrowserScreen] ========================================');
    console.log('[BrowserScreen] Initializing browser');
    console.log('[BrowserScreen] Address:', address);
    console.log('[BrowserScreen] Provider available:', !!provider);
    console.log('[BrowserScreen] Will inject Web3 provider');
    console.log('[BrowserScreen] ========================================');
    return () => logScreenUnmount('BrowserScreen');
  }, []);

  // Log when provider becomes available
  useEffect(() => {
    console.log('[BrowserScreen] Provider status changed:', !!provider);
    if (provider) {
      console.log('[BrowserScreen] Provider is now available');
    } else {
      console.log('[BrowserScreen] Provider is NOT available');
    }
  }, [provider]);

  const normalizeUrl = (urlString: string): string => {
    let normalized = urlString.trim();
    
    // If it's just a domain or search term without protocol
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      // Check if it looks like a domain (has a dot and no spaces)
      if (normalized.includes('.') && !normalized.includes(' ')) {
        normalized = `https://${normalized}`;
      } else {
        // Otherwise treat it as a search query
        normalized = `https://www.google.com/search?q=${encodeURIComponent(normalized)}`;
      }
    }
    
    return normalized;
  };

  const handleNavigate = useCallback(() => {
    const normalizedUrl = normalizeUrl(inputUrl);
    logUserAction('BrowserScreen', 'Navigate to URL', normalizedUrl);
    setUrl(normalizedUrl);
  }, [inputUrl]);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    // Intercept WalletConnect deep link attempts
    if (navState.url && (navState.url.startsWith('wc:') || navState.url.includes('://wc?uri='))) {
      console.log('[BrowserScreen] 🚫 Blocked WalletConnect deep link attempt');
      console.log('[BrowserScreen] Triggering auto-connect instead...');
      
      // Inject script to auto-connect using our provider
      webviewRef.current?.injectJavaScript(`
        (function() {
          const logToRN = (msg) => {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'debug_log',
                message: msg
              }));
            } catch (e) {}
          };
          
          logToRN('[AUTO-CONNECT] 🔗 WalletConnect blocked, connecting via injected provider');
          
          if (window.ethereum && window.ethereum.request) {
            window.ethereum.request({ method: 'eth_requestAccounts' })
              .then(accounts => {
                logToRN('[AUTO-CONNECT] ✅ Connected: ' + accounts[0]);
              })
              .catch(err => {
                logToRN('[AUTO-CONNECT] ❌ Error: ' + err.message);
              });
          } else {
            logToRN('[AUTO-CONNECT] ❌ No provider available');
          }
        })();
        true;
      `);
      
      return false; // Prevent navigation to WalletConnect URI
    }
    
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsLoading(navState.loading);
    
    // Update URL bar with current URL
    if (navState.url) {
      setUrl(navState.url);
      setInputUrl(navState.url);
    }
    
    // When page finishes loading, inject post-load script
    if (!navState.loading && navState.url) {
      console.log('[BrowserScreen] Page loaded, injecting post-load script');
      setTimeout(() => {
        webviewRef.current?.injectJavaScript(getPostLoadScript());
      }, 1000);
    }
  }, []);

  const handleGoBack = useCallback(() => {
    if (canGoBack && webviewRef.current) {
      logUserAction('BrowserScreen', 'Navigate back');
      webviewRef.current.goBack();
    }
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward && webviewRef.current) {
      logUserAction('BrowserScreen', 'Navigate forward');
      webviewRef.current.goForward();
    }
  }, [canGoForward]);

  const handleRefresh = useCallback(() => {
    if (webviewRef.current) {
      logUserAction('BrowserScreen', 'Refresh page');
      webviewRef.current.reload();
    }
  }, []);

  // Handle messages from WebView (Web3 requests)
  const handleWebViewMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      // Handle debug logs from WebView
      if (message.type === 'debug_log') {
        console.log(message.message);
        return;
      }
      
      console.log('[BrowserScreen] ========== NEW MESSAGE ==========');
      console.log('[BrowserScreen] Message type:', message.type);
      console.log('[BrowserScreen] Provider available:', !!provider);
      
      if (message.type === 'eth_request') {
        if (!provider) {
          console.error('[BrowserScreen] Provider not available!');
          return;
        }
        
        const { id, method, params } = message;
        console.log('[BrowserScreen] ========== WEB3 REQUEST ==========');
        console.log('[BrowserScreen] Request ID:', id);
        console.log('[BrowserScreen] Method:', method);
        console.log('[BrowserScreen] Params:', JSON.stringify(params));
        
        try {
          // Use the actual wallet provider to handle the request
          console.log('[BrowserScreen] Calling provider.request...');
          const result = await provider.request({ method, params });
          
          console.log('[BrowserScreen] ========== REQUEST SUCCESS ==========');
          console.log('[BrowserScreen] Result:', JSON.stringify(result));
          
          // Send response back to WebView
          const responseScript = `
            console.log('[RN->WebView] Sending response for request ${id}');
            window.postMessage(${JSON.stringify({
              type: 'eth_response',
              id,
              result
            })}, '*');
            true;
          `;
          console.log('[BrowserScreen] Injecting response script');
          webviewRef.current?.injectJavaScript(responseScript);
          console.log('[BrowserScreen] Response injected');
        } catch (error: any) {
          console.error('[BrowserScreen] ========== REQUEST ERROR ==========');
          console.error('[BrowserScreen] Error for method:', method);
          console.error('[BrowserScreen] Error message:', error.message);
          console.error('[BrowserScreen] Error stack:', error.stack);
          
          // Send error back to WebView
          const errorScript = `
            console.error('[RN->WebView] Sending error for request ${id}:', '${error.message}');
            window.postMessage(${JSON.stringify({
              type: 'eth_response',
              id,
              error: error.message || 'Request failed'
            })}, '*');
            true;
          `;
          console.log('[BrowserScreen] Injecting error script');
          webviewRef.current?.injectJavaScript(errorScript);
          console.log('[BrowserScreen] Error injected');
        }
      } else {
        console.log('[BrowserScreen] Ignoring message (not eth_request)');
      }
    } catch (error) {
      console.error('[BrowserScreen] ========== MESSAGE PARSE ERROR ==========');
      console.error('[BrowserScreen] Failed to parse message:', error);
      console.error('[BrowserScreen] Raw data:', event.nativeEvent.data);
    }
    
    console.log('[BrowserScreen] ========== MESSAGE HANDLED ==========\n');
  }, [provider]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* URL Bar */}
      <View style={styles.urlBarContainer}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleGoBack}
          disabled={!canGoBack}
          style={styles.navButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { opacity: canGoBack ? 1 : 0.3 }]}>
            ‹
          </Text>
        </TouchableOpacity>

        {/* Forward Button */}
        <TouchableOpacity
          onPress={handleGoForward}
          disabled={!canGoForward}
          style={styles.navButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { opacity: canGoForward ? 1 : 0.3 }]}>
            ›
          </Text>
        </TouchableOpacity>

        {/* URL Input */}
        <TextInput
          style={styles.urlInput}
          value={inputUrl}
          onChangeText={setInputUrl}
          onSubmitEditing={handleNavigate}
          onFocus={(e) => {
            e.currentTarget.setNativeProps({
              selection: { start: 0, end: inputUrl.length }
            });
          }}
          placeholder="Enter URL..."
          placeholderTextColor={Color.FG_3}
          keyboardAppearance="dark"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          selectTextOnFocus
        />

        {/* Refresh Button */}
        <TouchableOpacity 
          onPress={handleRefresh} 
          style={styles.navButton}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Color.BRIGHT_ACCENT} />
          ) : (
            <Ionicons name="reload" size={20} color={Color.BRIGHT_ACCENT} />
          )}
        </TouchableOpacity>
      </View>

      {/* WebView with Web3 Provider and Dark Mode */}
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        onShouldStartLoadWithRequest={(request) => {
          const requestUrl = request.url;
          
          // Block WalletConnect deep link attempts
          if (requestUrl.startsWith('wc:') || requestUrl.includes('://wc?uri=')) {
            console.log('[BrowserScreen] 🚫 Intercepted WalletConnect URI:', requestUrl.substring(0, 50) + '...');
            console.log('[BrowserScreen] Auto-connecting with injected provider instead...');
            
            // Trigger connection via injected provider
            webviewRef.current?.injectJavaScript(`
              (function() {
                const logToRN = (msg) => {
                  try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'debug_log',
                      message: msg
                    }));
                  } catch (e) {}
                };
                
                logToRN('[AUTO-CONNECT] 🔗 Intercepted wallet click, auto-connecting...');
                
                if (window.ethereum && window.ethereum.request) {
                  window.ethereum.request({ method: 'eth_requestAccounts' })
                    .then(accounts => {
                      logToRN('[AUTO-CONNECT] ✅ Connected with: ' + accounts[0]);
                      
                      // Dispatch connect event
                      window.dispatchEvent(new CustomEvent('wallet_connected', {
                        detail: { address: accounts[0] }
                      }));
                    })
                    .catch(err => {
                      logToRN('[AUTO-CONNECT] ❌ Connection error: ' + err.message);
                    });
                } else {
                  logToRN('[AUTO-CONNECT] ❌ window.ethereum not available');
                }
              })();
              true;
            `);
            
            return false; // Block the WalletConnect navigation
          }
          
          // Allow all other navigation
          return true;
        }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleWebViewMessage}
        onConsoleMessage={(consoleEvent: any) => {
          const { level, message, lineNumber, sourceURL } = consoleEvent.nativeEvent;
          const prefix = `[WebView Console ${level.toUpperCase()}]`;
          
          if (level === 'error') {
            console.error(`${prefix} ${message}`, { lineNumber, sourceURL });
          } else if (level === 'warning') {
            console.warn(`${prefix} ${message}`, { lineNumber, sourceURL });
          } else {
            console.log(`${prefix} ${message}`);
          }
        }}
        injectedJavaScriptBeforeContentLoaded={address ? getInjectionScript(address, 42161) : undefined}
        injectedJavaScript={address ? `
          (function() {
            const logToRN = (msg) => {
              try {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'debug_log',
                  message: msg
                }));
              } catch (e) {}
            };
            
            logToRN('[INJECTION TEST] 🧪 Post-content-load script running');
            logToRN('[INJECTION TEST] window.ethereum exists: ' + !!window.ethereum);
            
            if (!window.ethereum) {
              logToRN('[INJECTION TEST] ❌ Creating window.ethereum NOW (backup)');
              // Create a minimal provider as backup
              window.ethereum = {
                isMetaMask: true,
                selectedAddress: '${address}',
                chainId: '0xa4b1',
                request: async ({ method }) => {
                  logToRN('[BACKUP PROVIDER] Request: ' + method);
                  if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
                    return ['${address}'];
                  }
                  if (method === 'eth_chainId') {
                    return '0xa4b1';
                  }
                  return null;
                }
              };
              logToRN('[INJECTION TEST] ✅ Backup provider created');
            } else {
              logToRN('[INJECTION TEST] ✅ window.ethereum already exists!');
            }
          })();
          true;
        ` : undefined}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Image
              source={require('../../../../assets/blob_green.gif')}
              style={styles.loadingGif}
            />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[BrowserScreen] WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[BrowserScreen] HTTP error:', nativeEvent);
        }}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
      />
    </SafeAreaView>
  );
}

