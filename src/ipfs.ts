import { DAppNodePackageVersion } from "./types";
import axios from "axios";
import { ipfsUrl } from "./utils";

async function pinToIPFS(pkg: DAppNodePackageVersion) {
  try {
    await axios({
      method: "post",
      url: `${ipfsUrl}/api/v0/pin/add/${pkg.hash}`,
      timeout: 30000,
    });
    console.log(`Pinned ${pkg.name} with hash: ${pkg.hash}`);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.log(`Could not pin ${pkg.name}: ${e.message}`, 
        e.response?.data ? `Response: ${JSON.stringify(e.response.data)}` : '');
    } else {
      console.log(`Could not pin ${pkg.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

export { pinToIPFS };
