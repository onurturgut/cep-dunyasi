import { Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BankTransferInstructionsProps = {
  instructions: {
    accountHolder: string;
    iban: string;
    bankName: string;
    branchName?: string | null;
    description: string;
  };
};

export function BankTransferInstructions({ instructions }: BankTransferInstructionsProps) {
  return (
    <Card className="border-amber-200/80 bg-amber-50/80 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-4 w-4 text-amber-700" />
          Havale / EFT Talimatları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-amber-900">
        <p><span className="font-medium">Banka:</span> {instructions.bankName}</p>
        <p><span className="font-medium">Hesap Sahibi:</span> {instructions.accountHolder}</p>
        {instructions.branchName ? <p><span className="font-medium">Şube:</span> {instructions.branchName}</p> : null}
        <p><span className="font-medium">IBAN:</span> {instructions.iban}</p>
        <p><span className="font-medium">Açıklama:</span> {instructions.description}</p>
      </CardContent>
    </Card>
  );
}
