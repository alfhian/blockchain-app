import { ethers, Contract } from 'ethers';
import contractABI from '../abis/AnggaranBantuanABI.json';

// Use environment variables or fallback to constants
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x68a25bb8C9E7E1FF272023F948b2969793e09be7';
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/847d18875da64f2c8eb298d41b1ee414';

// Chain ID for Sepolia
const SEPOLIA_CHAIN_ID = 11155111;

const ensureBytes32Compatible = (value, fieldName) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} wajib diisi`);
  }

  if (value.length > 31) {
    throw new Error(`${fieldName} maksimal 31 karakter`);
  }
};

/**
 * Helper to get a public JSON-RPC provider.
 */
export const getProvider = () => {
  return new ethers.JsonRpcProvider(RPC_URL);
};

/**
 * Helper to decode bytes32 to string.
 */
const safeDecode = (val) => {
  try {
    if (!val || val === ethers.ZeroHash) return '';
    return ethers.decodeBytes32String(val);
  } catch (err) {
    console.warn('Failed to decode bytes32:', val, err);
    return val; // Fallback
  }
};

/**
 * Get user details from contract.
 */
export const getUserDetails = async (address) => {
  try {
    const provider = getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
    const userData = await contract.users(address);

    if (!userData || userData.kode === ethers.ZeroHash) {
      return [null, null, null, null];
    }

    const role = userData.role;
    const kode = safeDecode(userData.kode);
    const nama = safeDecode(userData.nama);
    const kontak = userData.kontak;

    return [role, kode, nama, kontak];
  } catch (err) {
    console.error('Error in getUserDetails:', err);
    throw err;
  }
};

/**
 * Register a new user.
 */
export const registerUser = async (signer, roleText, kode, nama, kontak) => {
  if (!roleText || !kode || !nama) {
    throw new Error('Kode, nama, dan role wajib diisi untuk registrasi');
  }
  ensureBytes32Compatible(kode, 'Kode');
  ensureBytes32Compatible(nama, 'Nama');

  try {
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
    
    const tx = await contract.registerUser(
      ethers.encodeBytes32String(kode),
      roleText.toUpperCase(),
      ethers.encodeBytes32String(nama),
      kontak
    );

    console.log('Registration tx sent:', tx.hash);
    return tx.hash;
  } catch (err) {
    console.error('Gagal registrasi user:', err);
    throw err;
  }
};

/**
 * Submit a new budget proposal (Pemerintah only).
 */
export const ajukanAnggaran = async (signer, kodeRegulasi, jumlahAnggaran) => {
  if (!kodeRegulasi || !jumlahAnggaran) {
    throw new Error('Semua field wajib diisi untuk ajukanAnggaran');
  }
  ensureBytes32Compatible(kodeRegulasi, 'Kode regulasi');

  try {
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
    
    const tx = await contract.ajukanAnggaran(
      ethers.encodeBytes32String(kodeRegulasi),
      ethers.parseUnits(jumlahAnggaran.toString(), 0) // Assuming no decimals for simplicity
    );

    console.log('Ajukan anggaran tx sent:', tx.hash);
    return tx.hash;
  } catch (err) {
    console.error('Gagal ajukan anggaran:', err);
    throw err;
  }
};

/**
 * Get budgets that haven't been allocated yet.
 */
export const getAnggaranBelumDialokasikan = async () => {
  try {
    const provider = getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
    const ids = await contract.getAnggaranBelumDialokasikan();

    return ids.map(id => ({
      label: `Anggaran #${id.toString()}`,
      value: id.toString()
    }));
  } catch (err) {
    console.error('Error in getAnggaranBelumDialokasikan:', err);
    return [];
  }
};

/**
 * Get all UKM users.
 */
export const getAllUkm = async () => {
  try {
    const provider = getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
    const [addresses, codes, names] = await contract.getAllUKMWithData();

    return addresses.map((addr, i) => ({
      label: `${safeDecode(names[i])} (${safeDecode(codes[i])})`,
      value: addr,
    }));
  } catch (err) {
    console.error('Error in getAllUkm:', err);
    return [];
  }
};

/**
 * Get budget info by ID.
 */
export const getInfoAnggaran = async (id) => {
  try {
    const provider = getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
    const [kodePemerintahRaw, kodeRegulasiRaw, jumlahAnggaran] = await contract.getInfoAnggaran(id);
    
    const formatted = new Intl.NumberFormat("id-ID").format(jumlahAnggaran);

    return [
      safeDecode(kodePemerintahRaw),
      safeDecode(kodeRegulasiRaw),
      formatted,
      jumlahAnggaran.toString(),
    ];
  } catch (err) {
    console.error('Error in getInfoAnggaran:', err);
    throw err;
  }
};

/**
 * Allocate budget to UKMs (Mitra only).
 */
export const alokasikanAnggaran = async (signer, id, kegiatan, ukmAddresses, anggaranUkm) => {
  if (id === undefined || id === null || id === '' || !ukmAddresses || ukmAddresses.length === 0) {
    throw new Error('ID dan setidaknya satu alamat UKM wajib diisi');
  }
  ensureBytes32Compatible(kegiatan, 'Kegiatan');

  try {
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
    
    const tx = await contract.alokasikanAnggaran(
      id,
      ethers.encodeBytes32String(kegiatan),
      ukmAddresses,
      anggaranUkm.map(a => ethers.parseUnits(a.toString(), 0))
    );

    console.log('Alokasi anggaran tx sent:', tx.hash);
    return tx.hash;
  } catch (err) {
    console.error('Gagal alokasikan anggaran:', err);
    throw err;
  }
};

/**
 * Get budgets assigned to a specific UKM.
 */
export const getAnggaranUntukUKM = async (address) => {
  try {
    const provider = getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
    const data = await contract.getAnggaranUntukUKM(address);

    return data.map(item => ({
      label: `Anggaran #${item.id.toString()}`,
      value: item.id.toString()
    }));
  } catch (err) {
    console.error('Error in getAnggaranUntukUKM:', err);
    return [];
  }
};

/**
 * Get detailed budget info for a specific UKM.
 */
export const getAnggaranUntukUKMById = async (id, address) => {
  try {
    const provider = getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
    const budgetData = await contract.getAnggaran(id);
    const ukmBudgetData = await contract.getAnggaranUntukUKMById(id, address);
    
    // Extract data from getAnggaran return values
    // id, idPemerintah, kodePemerintah, kodeRegulasi, jumlahAnggaran, kegiatan, disetujui, mitraPengalokasi, ukmTerpilih, jumlahValidasi, semuaUKMSudahValidasi
    const [,,,, totalAnggaran, kegiatan, , mitraPengalokasi] = budgetData;
    
    // Extract data from getAnggaranUntukUKMById return values
    const [ukmItem] = ukmBudgetData;
    const alokasiUKM = ukmItem.alokasi;

    const [, kodeMitra] = await getUserDetails(mitraPengalokasi);

    return [
      safeDecode(budgetData[2]), // kodePemerintah
      safeDecode(budgetData[3]), // kodeRegulasi
      new Intl.NumberFormat("id-ID").format(totalAnggaran),
      totalAnggaran.toString(),
      safeDecode(kegiatan),
      kodeMitra,
      new Intl.NumberFormat("id-ID").format(alokasiUKM),
    ];
  } catch (err) {
    console.error('Error in getAnggaranUntukUKMById:', err);
    throw err;
  }
};

/**
 * Validate received budget (UKM only).
 */
export const validasiDana = async (signer, id) => {
  try {
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
    const tx = await contract.validasiDana(id);

    console.log('Validasi dana tx sent:', tx.hash);
    return tx.hash;
  } catch (err) {
    console.error('Gagal validasi dana:', err);
    throw err;
  }
};

/**
 * Get statistics for charts.
 */
export const pieChartAnggaran = async (role, address) => {
  try {
    const provider = getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, contractABI.abi, provider);

    if (role === 'PEMERINTAH') {
      const stats = await contract.getStatistikAnggaran();
      return {
        belumDialokasikan: Number(stats[0]),
        menungguValidasi: Number(stats[1]),
        tervalidasi: Number(stats[2]),
      };
    }

    if (role === 'MITRA') {
      const stats = await contract.getJumlahTransaksiAlokasiMitra(address);
      return {
        menungguValidasi: Number(stats[0]),
        tervalidasi: Number(stats[1]),
      };
    }

    if (role === 'UKM') {
      const stats = await contract.getStatistikAnggaranUntukUKM(address);
      return {
        menungguValidasi: Number(stats[0]),
        tervalidasi: Number(stats[1]),
      };
    }

    return null;
  } catch (err) {
    console.error('Error in pieChartAnggaran:', err);
    return null;
  }
};
