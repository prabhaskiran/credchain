require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // Free local blockchain started with: npx hardhat node
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // OPTIONAL upgrade for a public demo: Polygon Amoy testnet (free test MATIC
    // from a faucet, e.g. https://faucet.polygon.technology/).
    // Fill these into your .env if you want to deploy publicly.
    amoy: {
      url: process.env.AMOY_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
