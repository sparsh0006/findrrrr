import dotenv from 'dotenv';
import { db } from '../src/database/client';

dotenv.config();

async function testDatabase() {
  console.log('Testing database connection...');

  try {
    await db.connect();
    console.log('Database connection successful');

    const result = await db.prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database query test passed:', result);

    const transactionCount = await db.prisma.transaction.count();
    console.log(`Transactions table accessible. Current count: ${transactionCount}`);

    const tokenTransferCount = await db.prisma.tokenTransfer.count();
    console.log(`TokenTransfers table accessible. Current count: ${tokenTransferCount}`);

    const largeTransferCount = await db.prisma.largeTransfer.count();
    console.log(`LargeTransfers table accessible. Current count: ${largeTransferCount}`);

    const failedTxCount = await db.prisma.failedTransaction.count();
    console.log(`FailedTransactions table accessible. Current count: ${failedTxCount}`);

    await db.disconnect();
    console.log('Database test completed successfully');
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();
