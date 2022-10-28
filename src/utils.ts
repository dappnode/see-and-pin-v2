const jsonRPCUrl =
  process.env.JSONRPCWS ||
  "wss://mainnet.infura.io/ws/v3/xxx";
const ipfsUrl = process.env.IPFS_URL || "";
export { jsonRPCUrl, ipfsUrl };
