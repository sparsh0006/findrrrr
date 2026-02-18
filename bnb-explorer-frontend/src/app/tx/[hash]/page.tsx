import { TxDetailClient } from "@/components/TxDetailClient";

export default function TxPage({ params }: { params: { hash: string } }) {
  return <TxDetailClient hash={params.hash} />;
}
