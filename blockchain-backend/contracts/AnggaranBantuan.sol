// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AnggaranBantuan
 * @dev Kontrak untuk manajemen anggaran bantuan UKM dengan transparansi blockchain.
 */
contract AnggaranBantuan is AccessControl {
    bytes32 public constant PEMERINTAH_ROLE = keccak256("PEMERINTAH_ROLE");
    bytes32 public constant MITRA_ROLE = keccak256("MITRA_ROLE");
    bytes32 public constant UKM_ROLE = keccak256("UKM_ROLE");

    struct User {
        bytes32 kode;
        bytes32 nama;
        string kontak;
        string role; // Simpan string role untuk kemudahan di frontend
    }

    struct Anggaran {
        uint256 id;
        address idPemerintah;
        bytes32 kodeRegulasi;
        uint256 jumlahAnggaran;
        bytes32 kegiatan;
        bool disetujui;
        address mitraPengalokasi;
        address[] ukmTerpilih;
        uint256[] alokasi;
        uint8 jumlahValidasi;
        uint256 submitTimestamp;
        uint256 alokasiTimestamp;
        uint256 validasiTimestamp;
        mapping(address => bool) validasiUkm;
    }

    struct AnggaranInfo {
        uint256 id;
        uint256 jumlahAnggaran;
        uint256 submitTimestamp;
        uint256 alokasiTimestamp;
        uint256 validasiTimestamp;
        bool sudahDialokasikan;
        bool sudahValidasi;
    }

    struct AnggaranUntukUKM {
        uint256 id;
        bytes32 kegiatan;
        uint256 jumlahAnggaran;
        uint256 alokasi;
        bool disetujui;
    }

    struct AnggaranUKMInfo {
        uint256 id;
        uint256 jumlahAnggaran;
        uint256 submitTimestamp;
        uint256 validasiTimestamp;
        bool sudahValidasi;
    }

    uint256 public anggaranCount;
    mapping(uint256 => Anggaran) private daftarAnggaran;
    mapping(address => User) public users;
    
    address[] private pemerintahAddresses;
    address[] private mitraAddresses;
    address[] private ukmAddresses;

    event RoleSet(address indexed user, string role, bytes32 kode);
    event AnggaranDiajukan(uint256 indexed id, address indexed idPemerintah, bytes32 kodeRegulasi, uint256 jumlahAnggaran, uint256 timestamp, uint256 blockNumber);
    event AnggaranDialokasikan(uint256 indexed id, address indexed mitra, bytes32 kegiatan, address[] ukmTerpilih, uint256[] alokasi);
    event UkmValidasi(uint256 indexed id, address indexed ukm, bytes32 kodeUkm);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Registrasi user baru dan set role secara otomatis (untuk demo/testing).
     * Di lingkungan produksi, role PEMERINTAH_ROLE harus dibatasi.
     */
    function registerUser(bytes32 kode, string memory role, bytes32 nama, string memory kontak) public {
        require(users[msg.sender].kode == bytes32(0), "User sudah terdaftar");
        
        users[msg.sender] = User({
            kode: kode,
            nama: nama,
            kontak: kontak,
            role: role
        });

        bytes32 roleHash = keccak256(bytes(role));
        if (roleHash == keccak256("PEMERINTAH")) {
            _grantRole(PEMERINTAH_ROLE, msg.sender);
            pemerintahAddresses.push(msg.sender);
        } else if (roleHash == keccak256("MITRA")) {
            _grantRole(MITRA_ROLE, msg.sender);
            mitraAddresses.push(msg.sender);
        } else if (roleHash == keccak256("UKM")) {
            _grantRole(UKM_ROLE, msg.sender);
            ukmAddresses.push(msg.sender);
        } else {
            revert("Role tidak valid");
        }

        emit RoleSet(msg.sender, role, kode);
    }

    function gantiAdmin(address adminBaru) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(adminBaru != address(0), "Alamat tidak valid");
        _grantRole(DEFAULT_ADMIN_ROLE, adminBaru);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function ajukanAnggaran(bytes32 _kodeRegulasi, uint256 _jumlahAnggaran) public onlyRole(PEMERINTAH_ROLE) {
        Anggaran storage anggaran = daftarAnggaran[anggaranCount];
        anggaran.id = anggaranCount;
        anggaran.idPemerintah = msg.sender;
        anggaran.kodeRegulasi = _kodeRegulasi;
        anggaran.jumlahAnggaran = _jumlahAnggaran;
        anggaran.disetujui = false;
        anggaran.submitTimestamp = block.timestamp;

        emit AnggaranDiajukan(anggaranCount, msg.sender, _kodeRegulasi, _jumlahAnggaran, block.timestamp, block.number);
        anggaranCount++;
    }

    function alokasikanAnggaran(uint256 _id, bytes32 _kegiatan, address[] memory _ukmTerpilih, uint256[] memory _alokasi) public onlyRole(MITRA_ROLE) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        require(_ukmTerpilih.length > 0 && _ukmTerpilih.length <= 3, "Pilih 1-3 UKM");
        require(_ukmTerpilih.length == _alokasi.length, "Data UKM dan alokasi tidak sinkron");

        Anggaran storage anggaran = daftarAnggaran[_id];
        require(!anggaran.disetujui, "Anggaran sudah dialokasikan");

        uint256 totalAlokasi = 0;
        for (uint i = 0; i < _alokasi.length; i++) {
            totalAlokasi += _alokasi[i];
        }
        require(totalAlokasi <= anggaran.jumlahAnggaran, "Total alokasi melebihi anggaran");

        anggaran.kegiatan = _kegiatan;
        anggaran.ukmTerpilih = _ukmTerpilih;
        anggaran.alokasi = _alokasi;
        anggaran.disetujui = true;
        anggaran.mitraPengalokasi = msg.sender;
        anggaran.alokasiTimestamp = block.timestamp;

        emit AnggaranDialokasikan(_id, msg.sender, _kegiatan, _ukmTerpilih, _alokasi);
    }

    function validasiDana(uint256 _id) public onlyRole(UKM_ROLE) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        Anggaran storage anggaran = daftarAnggaran[_id];
        require(anggaran.disetujui, "Anggaran belum dialokasikan");

        bool isSelected = false;
        for (uint i = 0; i < anggaran.ukmTerpilih.length; i++) {
            if (anggaran.ukmTerpilih[i] == msg.sender) {
                isSelected = true;
                break;
            }
        }

        require(isSelected, "Bukan UKM terpilih");
        require(!anggaran.validasiUkm[msg.sender], "Sudah validasi");

        anggaran.validasiUkm[msg.sender] = true;
        anggaran.jumlahValidasi++;
        
        if (anggaran.jumlahValidasi == anggaran.ukmTerpilih.length) {
            anggaran.validasiTimestamp = block.timestamp;
        }

        emit UkmValidasi(_id, msg.sender, users[msg.sender].kode);
    }

    // --- View Functions ---

    function getAnggaran(uint256 _id) public view returns (
        uint256 id,
        address idPemerintah,
        bytes32 kodePemerintah,
        bytes32 kodeRegulasi,
        uint256 jumlahAnggaran,
        bytes32 kegiatan,
        bool disetujui,
        address mitraPengalokasi,
        address[] memory ukmTerpilih,
        uint8 jumlahValidasi,
        bool semuaUKMSudahValidasi
    ) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        Anggaran storage a = daftarAnggaran[_id];
        return (
            a.id,
            a.idPemerintah,
            users[a.idPemerintah].kode,
            a.kodeRegulasi,
            a.jumlahAnggaran,
            a.kegiatan,
            a.disetujui,
            a.mitraPengalokasi,
            a.ukmTerpilih,
            a.jumlahValidasi,
            a.jumlahValidasi == a.ukmTerpilih.length && a.disetujui
        );
    }

    function getInfoAnggaran(uint256 _id) public view returns (bytes32 kodePemerintah, bytes32 kodeRegulasi, uint256 jumlahAnggaran) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        Anggaran storage a = daftarAnggaran[_id];
        return (users[a.idPemerintah].kode, a.kodeRegulasi, a.jumlahAnggaran);
    }

    function getAnggaranBelumDialokasikan() public view returns (uint256[] memory ids) {
        uint256 count = 0;
        for (uint i = 0; i < anggaranCount; i++) {
            if (!daftarAnggaran[i].disetujui) count++;
        }
        
        ids = new uint256[](count);
        uint256 index = 0;
        for (uint i = 0; i < anggaranCount; i++) {
            if (!daftarAnggaran[i].disetujui) {
                ids[index] = i;
                index++;
            }
        }
    }

    function getAllUKMWithData() public view returns (address[] memory addrs, bytes32[] memory kodeUkms, bytes32[] memory namaUkms) {
        addrs = ukmAddresses;
        kodeUkms = new bytes32[](ukmAddresses.length);
        namaUkms = new bytes32[](ukmAddresses.length);
        for (uint i = 0; i < ukmAddresses.length; i++) {
            kodeUkms[i] = users[ukmAddresses[i]].kode;
            namaUkms[i] = users[ukmAddresses[i]].nama;
        }
    }

    function getStatistikAnggaran() public view returns (uint256 belumDialokasikan, uint256 menungguValidasi, uint256 tervalidasi) {
        for (uint i = 0; i < anggaranCount; i++) {
            Anggaran storage a = daftarAnggaran[i];
            if (!a.disetujui) {
                belumDialokasikan++;
            } else if (a.jumlahValidasi < a.ukmTerpilih.length) {
                menungguValidasi++;
            } else {
                tervalidasi++;
            }
        }
    }

    function getJumlahTransaksiAlokasiMitra(address mitra) public view returns (uint256 jumlahBelumValidasi, uint256 jumlahSudahValidasi) {
        for (uint i = 0; i < anggaranCount; i++) {
            Anggaran storage a = daftarAnggaran[i];
            if (a.mitraPengalokasi == mitra) {
                if (a.jumlahValidasi < a.ukmTerpilih.length) {
                    jumlahBelumValidasi++;
                } else {
                    jumlahSudahValidasi++;
                }
            }
        }
    }

    function getStatistikAnggaranUntukUKM(address ukm) public view returns (uint256 menungguValidasi, uint256 sudahValidasi) {
        for (uint i = 0; i < anggaranCount; i++) {
            Anggaran storage a = daftarAnggaran[i];
            bool isUkm = false;
            for (uint j = 0; j < a.ukmTerpilih.length; j++) {
                if (a.ukmTerpilih[j] == ukm) {
                    isUkm = true;
                    break;
                }
            }
            if (isUkm) {
                if (a.validasiUkm[ukm]) {
                    sudahValidasi++;
                } else {
                    menungguValidasi++;
                }
            }
        }
    }

    function getAnggaranUntukUKM(address ukm) public view returns (AnggaranUntukUKM[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < anggaranCount; i++) {
            for (uint j = 0; j < daftarAnggaran[i].ukmTerpilih.length; j++) {
                if (daftarAnggaran[i].ukmTerpilih[j] == ukm) {
                    count++;
                    break;
                }
            }
        }

        AnggaranUntukUKM[] memory result = new AnggaranUntukUKM[](count);
        uint256 index = 0;
        for (uint i = 0; i < anggaranCount; i++) {
            Anggaran storage a = daftarAnggaran[i];
            for (uint j = 0; j < a.ukmTerpilih.length; j++) {
                if (a.ukmTerpilih[j] == ukm) {
                    result[index] = AnggaranUntukUKM({
                        id: a.id,
                        kegiatan: a.kegiatan,
                        jumlahAnggaran: a.jumlahAnggaran,
                        alokasi: a.alokasi[j],
                        disetujui: a.validasiUkm[ukm]
                    });
                    index++;
                    break;
                }
            }
        }
        return result;
    }

    function getAnggaranUntukUKMById(uint256 _id, address ukm) public view returns (AnggaranUntukUKM[] memory) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        Anggaran storage a = daftarAnggaran[_id];
        
        uint256 alokasiUkm = 0;
        bool found = false;
        for (uint i = 0; i < a.ukmTerpilih.length; i++) {
            if (a.ukmTerpilih[i] == ukm) {
                alokasiUkm = a.alokasi[i];
                found = true;
                break;
            }
        }
        
        require(found, "Bukan UKM terpilih");
        
        AnggaranUntukUKM[] memory result = new AnggaranUntukUKM[](1);
        result[0] = AnggaranUntukUKM({
            id: a.id,
            kegiatan: a.kegiatan,
            jumlahAnggaran: a.jumlahAnggaran,
            alokasi: alokasiUkm,
            disetujui: a.validasiUkm[ukm]
        });
        return result;
    }

    // Utility views
    function getAllPemerintah() public view returns (address[] memory) { return pemerintahAddresses; }
    function getAllMitra() public view returns (address[] memory) { return mitraAddresses; }
    function getAllUKM() public view returns (address[] memory) { return ukmAddresses; }
}
