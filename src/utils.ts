const ipfsUrl = process.env.IPFS_URL || "https://api.ipfs.dappnode.io";

const explorerGraphURL = process.env.GRAPH_URL || "https://api.studio.thegraph.com/query/90626/dappnode-explorer/version/latest/"

async function fetchGraphQL<T>(endpoint: string, query: any, retries = 15, initialDelay = 1000) {
  let currentDelay = initialDelay;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { limit: 3 },
        }),
      });
      
      // Wait for 500ms standard delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Handle rate limiting
      if (response.status === 429) {
        if (attempt === retries) {
          throw new Error('GraphQL request failed: Too many rate limit errors');
        }
        
        // Exponential backoff
        console.warn(`Rate limited (429). Retrying in ${currentDelay}ms... (Attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 2; // Exponential backoff
        continue;
      }

      // Check if response is okay for other status codes
      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const data: T = await response.json() as T;
      return data;
    } catch (error) {
      if (attempt === retries) {
        console.error('Error making GraphQL request:', error);
        process.exit(0);
      }
      
      // For other errors, also use backoff
      console.warn(`Request failed. Retrying in ${currentDelay}ms... (Attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= 2;
    }
  }
}

export { ipfsUrl, fetchGraphQL, explorerGraphURL};
