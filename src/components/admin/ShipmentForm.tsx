"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ShipmentFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { cargoCompany: string; trackingNumber: string; status: "preparing" | "shipped" | "delivered" }) => Promise<void> | void;
};

export function ShipmentForm({ open, onOpenChange, onSubmit }: ShipmentFormProps) {
  const [cargoCompany, setCargoCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState<"preparing" | "shipped" | "delivered">("shipped");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Kargo Bilgisi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kargo Firmasi</Label>
            <Input value={cargoCompany} onChange={(event) => setCargoCompany(event.target.value)} placeholder="Yurtici, Aras, MNG..." />
          </div>
          <div className="space-y-2">
            <Label>Takip Numarasi</Label>
            <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Takip numarasi" />
          </div>
          <div className="space-y-2">
            <Label>Durum</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "preparing" | "shipped" | "delivered")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preparing">Hazirlaniyor</SelectItem>
                <SelectItem value="shipped">Kargoya Verildi</SelectItem>
                <SelectItem value="delivered">Teslim Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={async () => {
              await onSubmit({ cargoCompany, trackingNumber, status });
              setCargoCompany("");
              setTrackingNumber("");
              setStatus("shipped");
            }}
          >
            Kargo Bilgisi Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
