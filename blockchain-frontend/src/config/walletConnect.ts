import { EthereumProvider } from '@walletconnect/ethereum-provider';

type WalletConnectProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

let provider: WalletConnectProvider | null = null;

export const providerMetadata = {
  name: 'Bantuan UKM',
  description: 'Bantuan UKM Application',
  url: 'https://your-project-website.com/',
  icons: ['https://your-project-logo.com/'],
  redirect: {
    native: 'bantuanukm://',
  },
};

const defaultParams = {
  projectId: '1cce4f444c2ea269a7c1cd573eaf9f5c',
  chains: [11155111] as [number, ...number[]],
  optionalChains: [11155111] as [number, ...number[]],
  showQrModal: true,
  rpcMap: {
    11155111: 'https://sepolia.infura.io/v3/847d18875da64f2c8eb298d41b1ee414',
  },
  methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData'],
  events: ['chainChanged', 'accountsChanged'],
  metadata: providerMetadata,
};

export const initWalletConnect = async () => {
  if (provider?.disconnect) {
    await provider.disconnect();
  }
  provider = null;

  provider = await EthereumProvider.init(defaultParams);
  await provider.enable();

  return provider;
};

export const connectWallet = async () => {
  if (provider?.disconnect) {
    await provider.disconnect();
  }
  provider = null;

  provider = await EthereumProvider.init(defaultParams);
  await provider.enable();

  return provider;
};
