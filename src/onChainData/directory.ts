import Web3 from "web3";
import { listenForPackageVersionsAndPin } from "./packages";
import { DAppNodePackage } from "../types";

const registryAbi = require("../../abi/dnp.json");

async function getPackagesFromDirectory(
  web3: Web3,
  ensName: string
): Promise<DAppNodePackage[]> {
  const dirAddress = await web3.eth.ens.getAddress(ensName);
  const contract = new web3.eth.Contract(registryAbi, dirAddress);
  const fromBlock = 5254499;
  const latestBlock = await web3.eth.getBlockNumber();

  const pastEvents = await contract.getPastEvents("NewRepo", {
    fromBlock,
    toBlock: latestBlock,
  });

  const packages: DAppNodePackage[] = pastEvents.map((e: any) => {
    return {
      name: `${e["returnValues"]["name"]}.${ensName}`,
      address: e["returnValues"]["repo"],
    };
  });

  return packages;
}

async function listenToDirectory(
  web3: Web3,
  ensName: string,
  skipPinning: boolean
) {
  const dirAddress = await web3.eth.ens.getAddress(ensName);
  const contract = new web3.eth.Contract(registryAbi, dirAddress);
  console.log("--- Event listener on %s started ---", ensName);
  contract.events.NewRepo().on("data", async (e: any) => {
    const pkg: DAppNodePackage = {
      name: `${e["returnValues"]["name"]}.${ensName}`,
      address: e["returnValues"]["repo"],
    };
    console.log(
      "Package %s added to %s, starting to listen for updates",
      ensName,
      pkg.name
    );
    listenForPackageVersionsAndPin(web3, pkg, skipPinning);
  });
}

export { getPackagesFromDirectory, listenToDirectory };
