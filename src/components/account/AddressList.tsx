"use client";

import { MapPinPlus } from "lucide-react";
import type { AccountAddress } from "@/lib/account";
import { Button } from "@/components/ui/button";
import { AddressCard } from "@/components/account/AddressCard";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";

type AddressListProps = {
  addresses: AccountAddress[];
  isLoading?: boolean;
  error?: string | null;
  onCreate: () => void;
  onEdit: (address: AccountAddress) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  deletingAddressId?: string | null;
  settingDefaultAddressId?: string | null;
};

export function AddressList({
  addresses,
  isLoading,
  error,
  onCreate,
  onEdit,
  onDelete,
  onSetDefault,
  deletingAddressId,
  settingDefaultAddressId,
}: AddressListProps) {
  if (isLoading) {
    return <AccountSectionSkeleton cards={2} rows={4} />;
  }

  if (error) {
    return <AccountEmptyState icon={MapPinPlus} title="Adresler yuklenemedi" description={error} action={<Button onClick={onCreate}>Yeni Adres</Button>} />;
  }

  if (addresses.length === 0) {
    return (
      <AccountEmptyState
        icon={MapPinPlus}
        title="Henuz kayitli adresiniz yok"
        description="Siparislerinizi daha hizli tamamlamak icin teslimat adreslerinizi buradan ekleyebilirsiniz."
        action={<Button onClick={onCreate}>Ilk Adresi Ekle</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" onClick={onCreate}>
          <MapPinPlus className="mr-2 h-4 w-4" />
          Yeni Adres
        </Button>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={onEdit}
            onDelete={onDelete}
            onSetDefault={onSetDefault}
            isDeleting={deletingAddressId === address.id}
            isSettingDefault={settingDefaultAddressId === address.id}
          />
        ))}
      </div>
    </div>
  );
}
