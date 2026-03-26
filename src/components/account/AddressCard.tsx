"use client";

import { Edit3, MapPin, Star, Trash2 } from "lucide-react";
import type { AccountAddress } from "@/lib/account";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type AddressCardProps = {
  address: AccountAddress;
  onEdit: (address: AccountAddress) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  isDeleting?: boolean;
  isSettingDefault?: boolean;
};

export function AddressCard({ address, onEdit, onDelete, onSetDefault, isDeleting, isSettingDefault }: AddressCardProps) {
  return (
    <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-semibold text-foreground">{address.title}</p>
              {address.is_default ? <Badge className="rounded-full bg-primary text-primary-foreground">Varsayilan</Badge> : null}
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{address.full_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/20 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-1 text-sm leading-6 text-muted-foreground">
          <p>{address.address_line}</p>
          <p>
            {address.neighborhood}, {address.district} / {address.city}
          </p>
          {address.postal_code ? <p>Posta Kodu: {address.postal_code}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
          {!address.is_default ? (
            <Button type="button" variant="outline" size="sm" disabled={isSettingDefault} onClick={() => onSetDefault(address.id)}>
              <Star className="mr-2 h-4 w-4" />
              Varsayilan Yap
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(address)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Duzenle
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isDeleting} onClick={() => onDelete(address.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
