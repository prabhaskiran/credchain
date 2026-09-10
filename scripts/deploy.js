const hre = require("hardhat");

async function main() {
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("CredentialRegistry deployed to:", address);
  console.log("Copy this address into backend/.env as CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
