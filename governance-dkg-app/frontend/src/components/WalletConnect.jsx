/**
 * Wallet Connection Component
 * Handles MetaMask/Web3 wallet connection and authentication
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const WalletConnect = ({ onWalletConnected, onWalletDisconnected }) => {
  const [wallet, setWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);
  const [authSignature, setAuthSignature] = useState(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Check if wallet is already connected
  const checkWalletConnection = async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Check if we have saved auth in session storage
        const savedAuth = sessionStorage.getItem(`wallet_auth_${address}`);

        if (savedAuth) {
          const auth = JSON.parse(savedAuth);
          setWallet(address);
          setAuthMessage(auth.message);
          setAuthSignature(auth.signature);

          if (onWalletConnected) {
            onWalletConnected(address, auth.signature, auth.message);
          }
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  async function switchToBaseSepolia(provider) {
    const targetChainId = '0x14a34'; // 84532 in hex = Base Sepolia
  
    try {
      // Try switching first
      await provider.send('wallet_switchEthereumChain', [
        { chainId: targetChainId },
      ]);
    } catch (switchError) {
      // If network not added (error code 4902), add it
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await provider.send('wallet_addEthereumChain', [
            {
              chainId: targetChainId,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ]);
        } catch (addError) {
          throw new Error('Failed to add Base Sepolia network. Please add it manually in MetaMask.');
        }
      } else if (switchError.code === 4001) {
        throw new Error('You rejected the network switch. Please switch to Base Sepolia to use premium features.');
      } else {
        throw switchError;
      }
    }
  }

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      await switchToBaseSepolia(provider);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Get authentication message from backend
      const response = await axios.get(
        `${API_BASE_URL}/api/premium-reports/auth-message/${address}`
      );

      const messageToSign = response.data.message;

      // Sign the message
      const signature = await signer.signMessage(messageToSign);

      // Store auth in session
      sessionStorage.setItem(`wallet_auth_${address}`, JSON.stringify({
        message: messageToSign,
        signature,
        timestamp: Date.now()
      }));

      setWallet(address);
      setAuthMessage(messageToSign);
      setAuthSignature(signature);

      if (onWalletConnected) {
        onWalletConnected(address, signature, messageToSign);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    if (wallet) {
      sessionStorage.removeItem(`wallet_auth_${wallet}`);
    }

    setWallet(null);
    setAuthMessage(null);
    setAuthSignature(null);
    setError(null);

    if (onWalletDisconnected) {
      onWalletDisconnected();
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== wallet) {
        disconnectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet]);

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div style={styles.container}>
      {!wallet ? (
        <div>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            style={styles.connectButton}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>

          {!isMetaMaskInstalled() && (
            <p style={styles.warning}>
              MetaMask not detected.
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={styles.link}>
                Install MetaMask
              </a>
            </p>
          )}
        </div>
      ) : (
        <div style={styles.connectedContainer}>
          <div style={styles.walletInfo}>
            <span style={styles.walletLabel}>Connected:</span>
            <span style={styles.walletAddress}>{formatAddress(wallet)}</span>
          </div>
          <button onClick={disconnectWallet} style={styles.disconnectButton}>
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '1rem'
  },
  connectButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  connectedContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  walletInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  walletLabel: {
    color: '#6c757d',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  walletAddress: {
    backgroundColor: '#e9ecef',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  disconnectButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  warning: {
    marginTop: '0.75rem',
    color: '#856404',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem'
  },
  link: {
    marginLeft: '0.5rem',
    color: '#007bff',
    textDecoration: 'underline'
  },
  error: {
    marginTop: '0.75rem',
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem'
  }
};

export default WalletConnect;
