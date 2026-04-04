"use client";

import { useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PaymentStatusAlert } from "@/components/checkout/PaymentStatusAlert";
import { BankTransferInstructions } from "@/components/checkout/BankTransferInstructions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrderPaymentStatus, useRetryPayment } from "@/hooks/use-checkout";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/checkout";
import { formatCurrency } from "@/lib/utils";

type CheckoutResultScreenProps = {
  orderId: string | null;
  retryToken?: string | null;
  paymentQueryStatus?: string | null;
};

export default function CheckoutResultScreen({ orderId, retryToken, paymentQueryStatus }: CheckoutResultScreenProps) {
  const [retrying, setRetrying] = useState(false);
  const paymentStatusQuery = useOrderPaymentStatus(orderId, retryToken);
  const retryPayment = useRetryPayment();
  const summary = paymentStatusQuery.data;
  const effectiveStatus = summary?.paymentStatus ?? (paymentQueryStatus === "success" ? "paid" : paymentQueryStatus === "failed" ? "failed" : "pending");

  const handleRetry = async () => {
    if (!orderId || retrying) {
      return;
    }

    setRetrying(true);

    try {
      const result = await retryPayment.mutateAsync({
        orderId,
        retryToken,
        paymentMethod: "credit_card_3ds",
        installmentMonths: 1,
      });

      if (result.paymentPageUrl) {
        window.location.href = result.paymentPageUrl;
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {effectiveStatus === "paid" ? (
            <PaymentStatusAlert variant="success" title="Ödeme başarıyla tamamlandı" description="Siparişiniz onaylandı. Hazırlık ve kargo bilgileri hesabınızda görünecek." />
          ) : effectiveStatus === "failed" ? (
            <PaymentStatusAlert variant="error" title="Ödeme tamamlanamadı" description={summary?.paymentFailureReason ?? "Kart veya 3D Secure doğrulaması nedeniyle işlem tamamlanamadı. Aynı sipariş üzerinden tekrar deneyebilirsiniz."} />
          ) : (
            <PaymentStatusAlert variant="warning" title="Siparişiniz alındı" description="Ödeme durumu güncelleniyor. Sayfa otomatik olarak yenilenir." />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Sipariş No</span>
                <span className="font-medium text-foreground">{summary?.orderId ?? orderId ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ödeme Durumu</span>
                <span className="font-medium text-foreground">{summary ? PAYMENT_STATUS_LABELS[summary.paymentStatus] : effectiveStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ödeme Yöntemi</span>
                <span className="font-medium text-foreground">{summary ? PAYMENT_METHOD_LABELS[summary.paymentMethod] : "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Toplam</span>
                <span className="text-base font-semibold text-foreground">{summary ? formatCurrency(summary.finalPrice) : "-"}</span>
              </div>
              {summary?.paymentAttemptsCount ? (
                <div className="flex items-center justify-between">
                  <span>Deneme Sayısı</span>
                  <span className="font-medium text-foreground">{summary.paymentAttemptsCount}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {summary?.bankTransferInstructions ? <BankTransferInstructions instructions={summary.bankTransferInstructions} /> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {summary?.isRetryablePayment && effectiveStatus !== "paid" ? (
              <Button onClick={handleRetry} disabled={retrying || retryPayment.isPending} className="sm:flex-1">
                {retrying || retryPayment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Ödemeyi Tekrar Dene
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => (window.location.href = "/account/orders")} className="sm:flex-1">
              Siparişlerime Git
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/products")} className="sm:flex-1">
              Alışverişe Dön
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
