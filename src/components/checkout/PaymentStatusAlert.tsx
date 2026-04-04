import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PaymentStatusAlertProps = {
  variant: "success" | "warning" | "error";
  title: string;
  description: string;
};

export function PaymentStatusAlert({ variant, title, description }: PaymentStatusAlertProps) {
  const Icon = variant === "success" ? CheckCircle2 : variant === "warning" ? Clock3 : AlertCircle;

  return (
    <Alert variant={variant === "error" ? "destructive" : "default"} className={variant === "warning" ? "border-amber-300/80 bg-amber-50/80 text-amber-950" : undefined}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
