import minimist from "minimist";
import Web3 from "web3";

import {
  getPackagesFromDAppStore,
  listenToDappstore,
} from "./onChainData/dappstore";
import {
  getPackagesFromDirectory,
  listenToDirectory,
} from "./onChainData/directory";
import {
  getLatestPackageVersion,
  getPackageVersions,
} from "./onChainData/packages";

import { DAppNodePackage, DAppNodePackageVersion } from "./types";
import { jsonRPCUrl } from "./utils";
import { pinToIPFS } from "./ipfs";

async function pinPackages(pkgs: DAppNodePackageVersion[]) {
  for (const pkg of pkgs) {
    pinToIPFS(pkg);
    await new Promise((r) => setTimeout(r, 126));
  }
}

async function main() {
  const args = minimist(process.argv.slice(2), {
    string: ["web3provider", "listenDir", "iterateDir"],
    boolean: ["listenDS", "iterateDS", "noPin", "allVersions"],
  });

  const skipPinning = args["noPin"];
  const allVersions = args["allVersions"];

  const options = {
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false,
    },
  };

  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(
      args["web3provider"] ?? jsonRPCUrl,
      options
    )
  );

  var listening = false;

  if (args["listenDir"]) {
    const dirs = args["iterateDir"];
    for (const dir of dirs.split(",")) {
      listenToDirectory(web3, dir, skipPinning);
    }
    listening = true;
  }

  if (args["listenDS"]) {
    listenToDappstore(web3, skipPinning);
    listening = true;
  }

  const packages: DAppNodePackage[] = [];

  if (args["iterateDir"]) {
    const dirs = args["iterateDir"];
    for (const dir of dirs.split(",")) {
      console.log("Iterating over %s directory", dir);
      packages.push(...(await getPackagesFromDirectory(web3, dir)));
    }
  }

  if (args["iterateDS"]) {
    console.log("Iterating over DAppNodeStore directory");
    packages.push(...(await getPackagesFromDAppStore(web3)));
  }

  const uniquePackages = packages.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.name === value.name)
  );

  const packageVersions = (
    allVersions
      ? (
          await Promise.all(
            uniquePackages.map(
              async (pkg) => await getPackageVersions(web3, pkg)
            )
          )
        ).flat()
      : await Promise.all(
          uniquePackages.map(
            async (pkg) => await getLatestPackageVersion(web3, pkg)
          )
        )
  ).filter((p) => p) as DAppNodePackageVersion[];

  if (skipPinning) {
    packageVersions.forEach((e) =>
      console.log(`Skipped pinning ${e.name} ${e.version} ${e.hash}`)
    );
  } else {
    await pinPackages(packageVersions);
  }

  if (!listening) process.exit();
}

main().finally();
