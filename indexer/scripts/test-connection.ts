import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

async function testConnection() {
  const endpoint = process.env.RPC_ENDPOINT;

  if (!endpoint) {
    console.error('RPC_ENDPOINT not found in .env file');
    process.exit(1);
  }

  console.log('Testing BNB Chain RPC connection...');
  console.log('Using endpoint:', endpoint);

  try {
    const provider = new ethers.JsonRpcProvider(endpoint);

    const network = await provider.getNetwork();
    console.log(`Network:    ${network.name} (chainId ${network.chainId})`);

    const blockNumber = await provider.getBlockNumber();
    console.log(`Latest block: ${blockNumber}`);

    const block = await provider.getBlock(blockNumber);
    if (block) {
      const ts = new Date(block.timestamp * 1000).toISOString();
      console.log(`Block time:   ${ts}`);
      console.log(`Tx count:     ${block.transactions.length}`);
    }

    console.log('RPC connection is working!');
  } catch (error: any) {
    console.error('Connection test failed:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('Hint: Endpoint is refusing connections. Check RPC_ENDPOINT in .env');
    } else if (error.message.includes('timeout')) {
      console.log('Hint: Connection timed out. Check network or try a different endpoint.');
    }
    process.exit(1);
  }
}

testConnection().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
