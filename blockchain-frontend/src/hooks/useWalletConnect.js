import { useWalletConnectModal } from '@walletconnect/modal-react-native';
import { ethers } from 'ethers';

/**
 * Hook to manage Ethereum connection using WalletConnect.
 */
export const useEthereum = () => {
  const { isConnected, open, provider, address } = useWalletConnectModal();

  const openModal = async () => {
    try {
      console.log('🔓 Opening WalletConnect modal...');
      await open();
    } catch (e) {
      console.warn('⚠️ Failed to open modal:', e.message || e);
    }
  };

  const getSigner = async () => {
    if (!provider) {
      console.warn('⚠️ Provider not available');
      return null;
    }

    try {
      // Use BrowserProvider for Ethers v6
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const addr = await signer.getAddress();
      console.log('🧩 Signer address:', addr);
      return signer;
    } catch (e) {
      console.warn('⚠️ Failed to get signer:', e.message || e);
      return null;
    }
  };

  const safeDisconnect = async () => {
    try {
      if (!provider) return;
      
      console.log('🔌 Disconnecting...');
      await provider.disconnect();
      console.log('✅ Disconnected');
    } catch (err) {
      console.warn('⚠️ Failed to disconnect:', err.message || err);
    }
  };

  return {
    isConnected,
    openModal,
    getSigner,
    safeDisconnect,
    provider,
    address,
  };
};
