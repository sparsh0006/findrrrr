"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TransactionsClient } from "@/components/TransactionsClient";

function TransactionsInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "all";
  const search = searchParams.get("search") || "";

  return <TransactionsClient initialTab={tab} initialSearch={search} />;
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#484f58" }}>Loading...</div>}>
      <TransactionsInner />
    </Suspense>
  );
}