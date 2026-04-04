import { Building2, CreditCard, Store, Truck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { CheckoutPaymentMethod } from "@/lib/checkout";

const methodIconMap: Record<CheckoutPaymentMethod, typeof CreditCard> = {
  credit_card_3ds: CreditCard,
  bank_transfer: Building2,
  cash_on_delivery: Truck,
  pay_at_store: Store,
};

type PaymentMethodSelectorProps = {
  methods: Array<{
    method: CheckoutPaymentMethod;
    label: string;
    description: string;
    badge?: string;
  }>;
  value: CheckoutPaymentMethod;
  onChange: (value: CheckoutPaymentMethod) => void;
};

export function PaymentMethodSelector({ methods, value, onChange }: PaymentMethodSelectorProps) {
  return (
    <RadioGroup value={value} onValueChange={(next) => onChange(next as CheckoutPaymentMethod)} className="grid gap-3">
      {methods.map((method) => {
        const Icon = methodIconMap[method.method];
        const active = value === method.method;

        return (
          <label
            key={method.method}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors",
              active ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:border-primary/40",
            )}
          >
            <RadioGroupItem value={method.method} className="mt-1" />
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/40 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{method.label}</p>
                  {method.badge ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {method.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{method.description}</p>
              </div>
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
}
