import { DAppNodePackage, DAppNodePackageVersion } from "../types";
import { explorerGraphURL, fetchGraphQL } from "../utils";
interface LastVersionResponse {
  data: {
    repos: {
      lastVersion: {
        semanticVersion: string;
        contentUri: string;
      }
    }[]
  }
}

interface VersionResponse {
  data: {
    repos: {
      versions: {
        semanticVersion: string;
        contentUri: string;
      }[]
    }[]
  }
}

async function getLatestPackageVersion(
  pkg: DAppNodePackage
): Promise<DAppNodePackageVersion | undefined> {

  const [name, ...registry] = pkg.name.split(".");
  const LAST_VERSION = `
  query {
    repos(where: {name: "${name}" registryName: "${registry.join(".")}"}) {
      lastVersion {
        semanticVersion
        contentUri
      }
    }
  }
  `;

  const result = await fetchGraphQL<LastVersionResponse>(explorerGraphURL, LAST_VERSION);
  if(!result || result.data.repos.length == 0) return undefined;
  const lastVersion = result?.data?.repos[0].lastVersion;
  if(!lastVersion) return undefined;
  return {
    name: pkg.name,
    version: lastVersion.semanticVersion,
    hash: lastVersion.contentUri.slice(6)
  } as DAppNodePackageVersion;

}

async function getPackageVersions(
  pkg: DAppNodePackage,
): Promise<DAppNodePackageVersion[]> {
  const [name, ...registry] = pkg.name.split(".");
  const VERSIONS = `
  query {
    repos(where: {name: "${name}" registryName: "${registry.join(".")}"}) {
      versions {
        semanticVersion
        contentUri
      }
    }
  }
  `;
  const result = await fetchGraphQL<VersionResponse>(explorerGraphURL, VERSIONS);
  const versions = result?.data.repos[0].versions;
  if(!versions) return [];
  return versions.map(v => ({
    name: pkg.name,
    version: v.semanticVersion,
    hash: v.contentUri.slice(6)
  }) as DAppNodePackageVersion)
}


export {
  getLatestPackageVersion,
  getPackageVersions,
};
