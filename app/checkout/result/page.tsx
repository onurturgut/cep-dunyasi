import CheckoutResultScreen from "@/screens/CheckoutResult";

type CheckoutResultPageProps = {
  searchParams: Promise<{
    orderId?: string;
    retryToken?: string;
    payment?: string;
  }>;
};

export default async function CheckoutResultPage({ searchParams }: CheckoutResultPageProps) {
  const params = await searchParams;

  return (
    <CheckoutResultScreen
      orderId={params.orderId ?? null}
      retryToken={params.retryToken ?? null}
      paymentQueryStatus={params.payment ?? null}
    />
  );
}
