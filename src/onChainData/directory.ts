import { DAppNodePackage } from "../types";
import { explorerGraphURL, fetchGraphQL } from "../utils";
interface PackageResponse  {
  data: {
    repos: {
      id: string
      name: string
    }[]
  }
}

async function getPackagesFromDirectory(
  ensName: string
): Promise<DAppNodePackage[]> {

  const PACKAGES_QUERY = `
    query {
      repos(where: {registryName: "${ensName}"}) {
        id
        name
      }
    }
  `;

  const result = await fetchGraphQL<PackageResponse>(explorerGraphURL, PACKAGES_QUERY);
  const packages = result?.data?.repos || [];
  
  return packages.map(x => ({
    name: x.name + "." + ensName,
    address: x.id
  } as DAppNodePackage));
}

export { getPackagesFromDirectory };
