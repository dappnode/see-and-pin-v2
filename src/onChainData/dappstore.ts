import Web3 from "web3";
import { listenForPackageVersionsAndPin } from "./packages";
import { DAppNodePackage } from "../types";

const directoryAbi = require("../../abi/DAppNodePackageDirectory_metadata.json");
const directoryAddress = "0xf19f629642c6697af77d8316bef8de0de3a27a70";

async function getPackagesFromDAppStore(
  web3: Web3
): Promise<DAppNodePackage[]> {
  const contract = new web3.eth.Contract(directoryAbi, directoryAddress);
  const fromBlock = 5254499;
  const latestBlock = await web3.eth.getBlockNumber();

  const pastEvents = await contract.getPastEvents("PackageAdded", {
    fromBlock,
    toBlock: latestBlock,
  });
  const packages: DAppNodePackage[] = await Promise.all(
    pastEvents.map(async (e: any) => {
      return {
        name: e["returnValues"]["name"],
        address: await web3.eth.ens.getAddress(e["returnValues"]["name"]),
      };
    })
  );
  return packages;
}

async function listenToDappstore(web3: Web3, skipPinning: boolean) {
  const contract = new web3.eth.Contract(directoryAbi, directoryAddress);
  console.log("--- Event listener on DAppStore started ---");
  contract.events.PackageAdded().on("data", async (e: any) => {
    const pkg: DAppNodePackage = {
      name: e["returnValues"]["name"],
      address: await web3.eth.ens.getAddress(e["returnValues"]["name"]),
    };
    console.log("Package %s added, starting to listen for updates", pkg.name);
    listenForPackageVersionsAndPin(web3, pkg, skipPinning);
  });

  contract.events.StatusChanged().on("data", async (e: any) => {
    if (e["returnValues"]["newStatus"] === "0") return;

    const id = e["returnValues"]["idPackage"];
    const packageName = (await contract.methods.getPackage(<number>id).call())[
      "name"
    ];
    const pkg: DAppNodePackage = {
      name: packageName,
      address: await web3.eth.ens.getAddress(packageName),
    };
    console.log(
      "Package %s added, starting to listen for updates",
      packageName
    );
    listenForPackageVersionsAndPin(web3, pkg, skipPinning);
  });
}

export { getPackagesFromDAppStore, listenToDappstore };
