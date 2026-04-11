import { JsonRpcProvider } from '@ethersproject/providers';

const RPC_URLS = {
  11155111: 'https://sepolia.infura.io/v3/847d18875da64f2c8eb298d41b1ee414', // Sepolia
  80001: 'https://rpc-mumbai.maticvigil.com', // Polygon Mumbai
  1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  137: 'https://polygon-rpc.com',
  // Tambahkan sesuai chain yang kamu pakai
};

export const getPublicRpcProvider = (chainId) => {
  const url = RPC_URLS[chainId];
  if (!url) {
    throw new Error(`No RPC URL configured for chainId ${chainId}`);
  }
  return new JsonRpcProvider(url, chainId);
};
