import { DAppNodePackage, DAppNodePackageVersion } from "../types";
import Web3 from "web3";
import { pinToIPFS } from "../ipfs";

const repoAbi = require("../../abi/Repo_metadata.json");

async function getLatestPackageVersion(
  web3: Web3,
  pkg: DAppNodePackage
): Promise<DAppNodePackageVersion | undefined> {
  const repoContract = new web3.eth.Contract(repoAbi, pkg.address);
  try {
    const len = await repoContract.methods.getVersionsCount().call();
    const result = await repoContract.methods.getByVersionId(len).call();

    return {
      hash: web3.utils.hexToUtf8(result["contentURI"]).slice(6),
      version: result["semanticVersion"].join("."),
      name: pkg.name,
    };
  } catch (e) {
    console.warn("Could not find latest version for " + pkg.name);
  }
}

async function getPackageVersions(
  web3: Web3,
  pkg: DAppNodePackage,
  maxVersions: number = 0
): Promise<DAppNodePackageVersion[]> {
  const repoContract = new web3.eth.Contract(repoAbi, pkg.address);
  const len = await repoContract.methods.getVersionsCount().call();
  const versions: DAppNodePackageVersion[] = [];
  if (maxVersions == 0) maxVersions = len - 1;
  for (var i = Math.max(1, len - maxVersions); i <= len; i++) {
    const result = await repoContract.methods.getByVersionId(i).call();
    try {
      versions.push({
        hash: web3.utils.hexToUtf8(result["contentURI"]).slice(6),
        version: result["semanticVersion"].join("."),
        name: pkg.name,
      });
    } catch (e) {}
  }
  return versions;
}

async function listenForPackageVersionsAndPin(
  web3: Web3,
  pkg: DAppNodePackage,
  skipPinning: boolean
) {
  const contract = new web3.eth.Contract(repoAbi, pkg.address);
  console.log("Starting to listen for %s versions", pkg.name);
  contract.events.NewVersion().on("data", async (e: any) => {
    const semVersion = e["returnValues"]["semanticVersion"];
    console.log("Got new %s version: %s", pkg.name, semVersion.join("."));
    const result = await contract.methods
      .getBySemanticVersion(semVersion)
      .call();
    const multihash = web3.utils.hexToUtf8(result["contentURI"]).slice(6);
    if (skipPinning) return;
    await pinToIPFS({
      name: pkg.name,
      version: semVersion.join("."),
      hash: multihash,
    });
    console.log("Pinned!");
  });
}

export {
  getLatestPackageVersion,
  getPackageVersions,
  listenForPackageVersionsAndPin,
};
