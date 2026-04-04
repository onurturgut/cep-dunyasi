import { LockKeyhole } from "lucide-react";

type SecurePaymentNoteProps = {
  text: string;
};

export function SecurePaymentNote({ text }: SecurePaymentNoteProps) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{text}</p>
    </div>
  );
}
