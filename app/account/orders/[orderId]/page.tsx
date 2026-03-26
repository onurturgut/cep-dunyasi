import AccountOrderDetailScreen from "@/screens/account/OrderDetail";

type AccountOrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function AccountOrderDetailPage({ params }: AccountOrderDetailPageProps) {
  const { orderId } = await params;

  return <AccountOrderDetailScreen orderId={orderId} />;
}
