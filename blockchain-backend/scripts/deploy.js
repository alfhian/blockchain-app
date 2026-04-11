async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const AnggaranBantuan = await ethers.getContractFactory("AnggaranBantuan");
  const contract = await AnggaranBantuan.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
