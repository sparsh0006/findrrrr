import { AddressClient } from "@/components/AddressClient";

export default function AddressPage({ params }: { params: { address: string } }) {
  return <AddressClient address={params.address} />;
}
