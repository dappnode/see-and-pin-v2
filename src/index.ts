import minimist from "minimist";

import {
  getPackagesFromDirectory,
} from "./onChainData/directory";
import {
  getLatestPackageVersion,
  getPackageVersions,
} from "./onChainData/packages";

import { DAppNodePackage, DAppNodePackageVersion } from "./types";
import { pinToIPFS } from "./ipfs";

async function pinPackages(pkgs: DAppNodePackageVersion[]) {
  for (const pkg of pkgs) {
    pinToIPFS(pkg);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function main() {
  const args = minimist(process.argv.slice(2), {
    string: ["iterateDir"],
    boolean: ["noPin", "allVersions"],
  });

  const skipPinning = args["noPin"];
  const allVersions = args["allVersions"];


  
  const packages: DAppNodePackage[] = [];

  if (args["iterateDir"]) {
    const dirs = args["iterateDir"];
    for (const dir of dirs.split(",")) {
      console.log("Iterating over %s directory", dir);
      packages.push(...(await getPackagesFromDirectory(dir)));
    }
  }

  const uniquePackages = packages.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.name === value.name)
  );

  const packageVersions: DAppNodePackageVersion[] = [];
  
  if (allVersions) {
    for (const pkg of uniquePackages) {
      const versions = await getPackageVersions(pkg);
      packageVersions.push(...versions);
    }
  } else {
    for (const pkg of uniquePackages) {
      const version = await getLatestPackageVersion(pkg);
      if (version) packageVersions.push(version);
    }
  }

  if (skipPinning) {
    packageVersions.forEach((e) =>
      console.log(`Skipped pinning ${e.name} ${e.version} ${e.hash}`)
    );
  } else {
    await pinPackages(packageVersions);
  }

  process.exit();
}

main().finally();
