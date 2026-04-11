// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AnggaranBantuan is AccessControl {
    bytes32 public constant PEMERINTAH_ROLE = keccak256("PEMERINTAH_ROLE");
    bytes32 public constant MITRA_ROLE = keccak256("MITRA_ROLE");
    bytes32 public constant UKM_ROLE = keccak256("UKM_ROLE");

    struct Anggaran {
        address idPemerintah;
        string nama;
        string kodeRegulasi;
        uint256 jumlahAnggaran;
        bool disetujui;
        address[] mitraTerpilih;
        mapping(address => bool) validasiUkm;
        uint8 jumlahValidasi;
    }

    uint256 public anggaranCount;
    mapping(uint256 => Anggaran) private daftarAnggaran;

    // Mapping manual role (untuk pelengkap tracking)
    mapping(string => string) public userRoles;

    event AnggaranDiajukan(uint256 indexed id, address indexed idPemerintah, string nama, string kodeRegulasi, uint256 jumlahAnggaran);
    event AnggaranDialokasikan(uint256 indexed id, address indexed mitra, address[] mitraTerpilih);
    event UkmValidasi(uint256 indexed id, address indexed ukm);
    event RoleSet(address indexed user, string role);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // User bisa set role mereka sendiri saat registrasi
    function setInitialRole(string memory kode, string memory role) public {
        require(bytes(userRoles[kode]).length == 0, "Role sudah diset");

        bytes32 roleHash = keccak256(bytes(role));

        if (roleHash == keccak256("PEMERINTAH")) {
            _grantRole(PEMERINTAH_ROLE, msg.sender);
        } else if (roleHash == keccak256("MITRA")) {
            _grantRole(MITRA_ROLE, msg.sender);
        } else if (roleHash == keccak256("UKM")) {
            _grantRole(UKM_ROLE, msg.sender);
        } else {
            revert("Role tidak valid");
        }

        userRoles[kode] = role;
        emit RoleSet(msg.sender, role);
    }

    function gantiAdmin(address adminBaru) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(adminBaru != address(0), "Alamat tidak valid");
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(DEFAULT_ADMIN_ROLE, adminBaru);
    }

    function ajukanAnggaran(string memory _nama, string memory _kodeRegulasi, uint256 _jumlahAnggaran) public onlyRole(PEMERINTAH_ROLE) {
        Anggaran storage anggaran = daftarAnggaran[anggaranCount];
        anggaran.idPemerintah = msg.sender;
        anggaran.nama = _nama;
        anggaran.kodeRegulasi = _kodeRegulasi;
        anggaran.jumlahAnggaran = _jumlahAnggaran;
        anggaran.disetujui = false;
        anggaranCount++;

        emit AnggaranDiajukan(anggaranCount - 1, msg.sender, _nama, _kodeRegulasi, _jumlahAnggaran);
    }

    function alokasikanAnggaran(uint256 _id, address[] memory _ukmTerpilih) public onlyRole(MITRA_ROLE) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        require(_ukmTerpilih.length > 0 && _ukmTerpilih.length <= 3, "Pilih maksimal 3 UKM");

        Anggaran storage anggaran = daftarAnggaran[_id];
        require(!anggaran.disetujui, "Anggaran sudah dialokasikan");

        anggaran.mitraTerpilih = _ukmTerpilih;
        anggaran.disetujui = true;

        emit AnggaranDialokasikan(_id, msg.sender, _ukmTerpilih);
    }

    function validasiDana(uint256 _id) public onlyRole(UKM_ROLE) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        Anggaran storage anggaran = daftarAnggaran[_id];
        require(anggaran.disetujui, "Anggaran belum dialokasikan");

        bool isSelected = false;
        for (uint i = 0; i < anggaran.mitraTerpilih.length; i++) {
            if (anggaran.mitraTerpilih[i] == msg.sender) {
                isSelected = true;
                break;
            }
        }

        require(isSelected, "Anda bukan UKM terpilih untuk anggaran ini");
        require(!anggaran.validasiUkm[msg.sender], "Anda sudah validasi");

        anggaran.validasiUkm[msg.sender] = true;
        anggaran.jumlahValidasi++;

        emit UkmValidasi(_id, msg.sender);
    }

    function getAnggaran(uint256 _id) public view returns (
        address idPemerintah,
        string memory nama,
        string memory kodeRegulasi,
        uint256 jumlahAnggaran,
        bool disetujui,
        address[] memory mitraTerpilih,
        uint8 jumlahValidasi
    ) {
        require(_id < anggaranCount, "Anggaran tidak ditemukan");
        Anggaran storage anggaran = daftarAnggaran[_id];
        return (
            anggaran.idPemerintah,
            anggaran.nama,
            anggaran.kodeRegulasi,
            anggaran.jumlahAnggaran,
            anggaran.disetujui,
            anggaran.mitraTerpilih,
            anggaran.jumlahValidasi
        );
    }
}
