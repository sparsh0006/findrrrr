import dotenv from 'dotenv';
import { BnbClient } from './rpc/client';
import { db } from './database/client';
import { createDefaultConfig } from './rpc/subscriptions';

dotenv.config();

const client = new BnbClient();

async function main() {
  try {
    await db.connect();
    const config = createDefaultConfig();
    await client.start(config);
  } catch (error) {
    console.error('Fatal error starting indexer', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  try {
    client.stop();
    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    client.stop();
    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown', error);
    process.exit(1);
  }
});

main().catch((error) => {
  console.error('Unhandled error in main', error);
  process.exit(1);
});
