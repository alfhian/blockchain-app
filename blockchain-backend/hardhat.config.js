require("dotenv").config();
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20", // untuk AnggaranBantuan.sol
      },
      {
        version: "0.8.28", // untuk Lock.sol
      },
    ],
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
