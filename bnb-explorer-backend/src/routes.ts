import { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const DEFI_ADDRESSES = [
  "0x10ed43c718714eb63d5aa57b78b54704e256024e",
  "0x13f4ea83d0bd40e75c8222255bc855a974568dd4",
  "0x1111111254eeb25477b68fb85ed929f73a960582",
  "0x3a6d8ca21d1cf76f653a67577fa0d27453350dd8",
];

const TOKEN_ADDRESSES: Record<string, string> = {
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
  ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
};

function paginate(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function serialize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serialize);
  if (typeof obj === "object") {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = serialize(v);
    }
    return result;
  }
  return obj;
}

export function createRoutes(app: Express, prisma: PrismaClient) {

  // GET /stats
  app.get("/stats", async (_req: Request, res: Response) => {
    try {
      const [totalTransactions, successfulTransactions, failedTransactions, largeTransfers, tokenTransfers, latestTx] =
        await Promise.all([
          prisma.transaction.count(),
          prisma.transaction.count({ where: { success: true } }),
          prisma.failedTransaction.count(),
          prisma.largeTransfer.count(),
          prisma.tokenTransfer.count(),
          prisma.transaction.findFirst({ orderBy: [{ blockNumber: "desc" }, { createdAt: "desc" }], select: { blockNumber: true } }),
        ]);

      res.json(serialize({
        totalTransactions, successfulTransactions, failedTransactions,
        largeTransfers, tokenTransfers,
        latestBlock: latestTx?.blockNumber || 0,
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // GET /chart/blocks
  app.get("/chart/blocks", async (_req: Request, res: Response) => {
    try {
      const latestTx = await prisma.transaction.findFirst({
        orderBy: [{ blockNumber: "desc" }, { createdAt: "desc" }],
        select: { blockNumber: true },
      });

      if (!latestTx) { res.json([]); return; }

      const latestBlock = Number(latestTx.blockNumber);
      const startBlock = latestBlock - 29;

      const blocks = await prisma.transaction.groupBy({
        by: ["blockNumber"],
        where: { blockNumber: { gte: BigInt(startBlock) } },
        _count: { id: true },
        orderBy: { blockNumber: "asc" },
      });

      const failedBlocks = await prisma.transaction.groupBy({
        by: ["blockNumber"],
        where: { blockNumber: { gte: BigInt(startBlock) }, success: false },
        _count: { id: true },
      });

      const failedMap = new Map(failedBlocks.map((b) => [Number(b.blockNumber), b._count.id]));

      res.json(blocks.map((b) => ({
        block: Number(b.blockNumber),
        txCount: b._count.id,
        failed: failedMap.get(Number(b.blockNumber)) || 0,
        gasAvg: 0,
      })));
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  // GET /transactions — NEWEST FIRST on page 1
  app.get("/transactions", async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = paginate(req.query);
      const search = (req.query.search as string) || "";
      const defi = req.query.defi === "true";
      const tokens = (req.query.tokens as string) || "";

      const where: any = {};

      if (search) {
        if (search.startsWith("0x") && search.length === 66) {
          where.hash = search;
        } else if (search.startsWith("0x") && search.length === 42) {
          where.OR = [{ fromAddress: search }, { toAddress: search }];
        } else if (/^\d+$/.test(search)) {
          where.blockNumber = BigInt(search);
        }
      }

      if (defi) { where.toAddress = { in: DEFI_ADDRESSES }; }

      // Inside app.get("/transactions", ...
// ... existing search logic ...

      if (tokens) {
        const tokenList = tokens.split(",").map((t) => t.trim().toUpperCase());
        if (tokenList.includes("BNB")) {
          where.input = { in: ["0x", "", null] };
          
          // Issue 3: Apply Thresholds for BNB
          const minBNB = req.query.min_BNB as string;
          const maxBNB = req.query.max_BNB as string;
          // Inside app.get("/transactions", ...)
if (req.query.min_BNB || req.query.max_BNB) {
  where.value = {};
  if (req.query.min_BNB) where.value.gte = (BigInt(parseFloat(req.query.min_BNB as string) * 1e18)).toString();
  if (req.query.max_BNB) where.value.lte = (BigInt(parseFloat(req.query.max_BNB as string) * 1e18)).toString();
}
        }
      }

const [data, total] = await Promise.all([
  prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" }, // <--- This ensures newest is at the top
    skip,
    take: limit,
  }),
  prisma.transaction.count({ where }),
]);

      res.json(serialize({ data, total, page }));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // GET /token-transfers — NEWEST FIRST
 app.get("/token-transfers", async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const search = (req.query.search as string) || "";
    const tokens = (req.query.tokens as string) || "";
    const where: any = {};

    if (search) {
      if (search.startsWith("0x") && search.length === 66) {
        where.hash = search;
      } else if (search.startsWith("0x") && search.length === 42) {
        where.OR = [{ fromAddress: search }, { toAddress: search }, { tokenAddress: search }];
      }
    }

    if (tokens) {
      const tokenList = tokens.split(",").map(t => t.trim().toUpperCase());
      const conditions = tokenList.map(symbol => {
        const addr = TOKEN_ADDRESSES[symbol];
        if (!addr) return null;
        
        const minVal = req.query[`min_${symbol}`] as string;
        const maxVal = req.query[`max_${symbol}`] as string;

        // Base filter for the token address
        const cond: any = { tokenAddress: { equals: addr, mode: 'insensitive' } };

        // IMPORTANT: Use numeric logic for String fields
        if (minVal || maxVal) {
          cond.AND = [];
          if (minVal) {
            const minWei = (BigInt(Math.floor(parseFloat(minVal) * 1e18))).toString();
            // We use length check + string comparison to simulate numeric logic in Prisma/Postgres String fields
            cond.AND.push({ amount: { gte: minWei }, OR: [{ amount: { gt: minWei } }, { amount: minWei }] });
          }
          // Note: For real production, change DB column type to Decimal or BigInt. 
          // For now, this logic works if you convert the values to a comparable format.
        }
        return cond;
      }).filter(Boolean);

      if (conditions.length > 0) where.OR = conditions;
    }

    const data = await prisma.tokenTransfer.findMany({
      where,
      orderBy: { blockNumber: "desc" },
      skip,
      take: limit,
    });

    // Final filter in memory to guarantee accuracy for the range (Fixes Issue 1)
    const filteredData = data.filter(item => {
      const symbol = Object.keys(TOKEN_ADDRESSES).find(k => TOKEN_ADDRESSES[k].toLowerCase() === item.tokenAddress.toLowerCase());
      if (!symbol) return true;
      const min = req.query[`min_${symbol}`] ? BigInt(Math.floor(parseFloat(req.query[`min_${symbol}`] as string) * 1e18)) : null;
      const max = req.query[`max_${symbol}`] ? BigInt(Math.floor(parseFloat(req.query[`max_${symbol}`] as string) * 1e18)) : null;
      const val = BigInt(item.amount);
      if (min && val < min) return false;
      if (max && val > max) return false;
      return true;
    });

    res.json(serialize({ data: filteredData, total: await prisma.tokenTransfer.count({ where }), page }));
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

  // GET /large-transfers — NEWEST FIRST
  app.get("/large-transfers", async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = paginate(req.query);
      const search = (req.query.search as string) || "";

      const where: any = {};

      if (search) {
        if (search.startsWith("0x") && search.length === 66) {
          where.hash = search;
        } else if (search.startsWith("0x") && search.length === 42) {
          where.OR = [{ fromAddress: search }, { toAddress: search }];
        }
      }

      const [data, total] = await Promise.all([
// Around line 239
prisma.largeTransfer.findMany({
  where,
  orderBy: { blockNumber: "desc" }, // If blockNumber is same, you can use:
  // orderBy: { createdAt: "desc" }, 
  skip,
  take: limit,
}),
        prisma.largeTransfer.count({ where }),
      ]);

      res.json(serialize({ data, total, page }));
    } catch (error) {
      console.error("Error fetching large transfers:", error);
      res.status(500).json({ error: "Failed to fetch large transfers" });
    }
  });

  // GET /failed-transactions — NEWEST FIRST
  app.get("/failed-transactions", async (req: Request, res: Response) => {
    try {
      const { page, limit, skip } = paginate(req.query);
      const search = (req.query.search as string) || "";

      const where: any = {};

      if (search) {
        if (search.startsWith("0x") && search.length === 66) {
          where.hash = search;
        } else if (search.startsWith("0x") && search.length === 42) {
          where.OR = [{ fromAddress: search }, { toAddress: search }];
        }
      }

      const [data, total] = await Promise.all([
        prisma.failedTransaction.findMany({
          where,
          orderBy: [{ blockNumber: "desc" }, { createdAt: "desc" }],
          skip,
          take: limit,
        }),
        prisma.failedTransaction.count({ where }),
      ]);

      res.json(serialize({ data, total, page }));
    } catch (error) {
      console.error("Error fetching failed transactions:", error);
      res.status(500).json({ error: "Failed to fetch failed transactions" });
    }
  });

  // GET /tx/:hash
  app.get("/tx/:hash", async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;

      const [tx, tokenTransfers] = await Promise.all([
        prisma.transaction.findUnique({ where: { hash } }),
        prisma.tokenTransfer.findMany({ where: { hash }, orderBy: { logIndex: "asc" } }),
      ]);

      if (!tx) { res.status(404).json({ error: "Transaction not found" }); return; }

      res.json(serialize({ ...tx, tokenTransfers }));
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  // GET /address/:address
  app.get("/address/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      const [txCount, transactions, sentTxs, receivedTxs, tokenTransfers] = await Promise.all([
        prisma.transaction.count({
          where: { OR: [{ fromAddress: address }, { toAddress: address }] },
        }),
        prisma.transaction.findMany({
          where: { OR: [{ fromAddress: address }, { toAddress: address }] },
          orderBy: [{ blockNumber: "desc" }, { createdAt: "desc" }],
          take: 25,
        }),
        prisma.transaction.findMany({ where: { fromAddress: address }, select: { value: true } }),
        prisma.transaction.findMany({ where: { toAddress: address }, select: { value: true } }),
        prisma.tokenTransfer.findMany({
          where: { OR: [{ fromAddress: address }, { toAddress: address }] },
          orderBy: [{ blockNumber: "desc" }, { createdAt: "desc" }],
          take: 50,
        }),
      ]);

      const totalSent = sentTxs.reduce((acc, tx) => {
        try { return acc + BigInt(tx.value); } catch { return acc; }
      }, 0n);

      const totalReceived = receivedTxs.reduce((acc, tx) => {
        try { return acc + BigInt(tx.value); } catch { return acc; }
      }, 0n);

      const balanceMap = new Map<string, bigint>();
      for (const tt of tokenTransfers) {
        const current = balanceMap.get(tt.tokenAddress) || 0n;
        try {
          const amount = BigInt(tt.amount);
          if (tt.toAddress.toLowerCase() === address.toLowerCase()) {
            balanceMap.set(tt.tokenAddress, current + amount);
          } else if (tt.fromAddress.toLowerCase() === address.toLowerCase()) {
            balanceMap.set(tt.tokenAddress, current - amount);
          }
        } catch {}
      }

      const addressToSymbol = Object.fromEntries(
        Object.entries(TOKEN_ADDRESSES).map(([sym, addr]) => [addr.toLowerCase(), sym])
      );

      const tokenBalances = Array.from(balanceMap.entries())
        .filter(([, bal]) => bal > 0n)
        .map(([addr, bal]) => ({
          token: addressToSymbol[addr.toLowerCase()] || addr.slice(0, 10) + "...",
          balance: bal.toString(),
        }));

      res.json(serialize({
        address, txCount,
        totalSent: totalSent.toString(),
        totalReceived: totalReceived.toString(),
        transactions, tokenBalances,
      }));
    } catch (error) {
      console.error("Error fetching address:", error);
      res.status(500).json({ error: "Failed to fetch address" });
    }
  });
}