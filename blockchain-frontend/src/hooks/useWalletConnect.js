import { useWalletConnectModal } from '@walletconnect/modal-react-native';
import { Web3Provider } from '@ethersproject/providers';

export const useEthereum = () => {
  const { isConnected, open, provider, address } = useWalletConnectModal();

  const openModal = async () => {
    try {
      console.log('🔓 Membuka WalletConnect modal...');
      await open();
      console.log('✅ Modal terbuka');
    } catch (e) {
      console.warn('⚠️ Gagal openModal:', e.message || e);
    }
  };

  const getSigner = async () => {
    if (!provider) {
      console.warn('⚠️ Provider tidak tersedia');
      return null;
    }

    try {
      const ethersProvider = new Web3Provider(provider);
      const signer = ethersProvider.getSigner();
      const addr = await signer.getAddress();
      console.log('🧩 Signer address:', addr);
      return signer;
    } catch (e) {
      console.warn('⚠️ Gagal getSigner:', e.message || e);
      return null;
    }
  };

  const safeDisconnect = async () => {
    try {
      const topic = provider?.session?.topic;
      if (!topic) {
        console.log('⛔ Tidak ada session topic, skip disconnect');
        return;
      }

      console.log('🔌 Mencoba disconnect (topic:', topic, ')');
      await provider.disconnect();
      console.log('✅ Berhasil disconnect');
    } catch (err) {
      if (err.message?.includes('No matching key')) {
        console.warn('⚠️ Session tidak valid, skip disconnect');
      } else {
        console.warn('⚠️ Gagal disconnect:', err.message || err);
      }
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
