"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { AccountAddress } from "@/lib/account";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AddressForm } from "@/components/account/AddressForm";
import { AddressList } from "@/components/account/AddressList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "@/hooks/use-account";

export default function AccountAddressesScreen() {
  const addressesQuery = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AccountAddress | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [settingDefaultAddressId, setSettingDefaultAddressId] = useState<string | null>(null);

  const dialogTitle = useMemo(() => (editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"), [editingAddress]);

  const handleCreateClick = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleEditClick = (address: AccountAddress) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleSubmit = async (value: Omit<AccountAddress, "created_at" | "updated_at"> & { id?: string }) => {
    try {
      if (editingAddress?.id) {
        await updateAddress.mutateAsync({ ...value, id: editingAddress.id });
        toast.success("Adres güncellendi.");
      } else {
        await createAddress.mutateAsync(value);
        toast.success("Adres eklendi.");
      }

      setDialogOpen(false);
      setEditingAddress(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Adres kaydedilemedi");
    }
  };

  const handleDelete = async (addressId: string) => {
    try {
      setDeletingAddressId(addressId);
      await deleteAddress.mutateAsync(addressId);
      toast.success("Adres silindi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Adres silinemedi");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      setSettingDefaultAddressId(addressId);
      await setDefaultAddress.mutateAsync(addressId);
      toast.success("Varsayılan adres güncellendi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Varsayılan adres değiştirilemedi");
    } finally {
      setSettingDefaultAddressId(null);
    }
  };

  return (
    <AccountLayout
      title="Adreslerim"
      description="Teslimat adreslerinizi kaydedin, düzenleyin ve varsayılan adresinizi belirleyin."
      actions={
        <Button type="button" onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Adres
        </Button>
      }
    >
      <AddressList
        addresses={addressesQuery.data ?? []}
        isLoading={addressesQuery.isLoading}
        error={addressesQuery.error instanceof Error ? addressesQuery.error.message : null}
        onCreate={handleCreateClick}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
        deletingAddressId={deletingAddressId}
        settingDefaultAddressId={settingDefaultAddressId}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[1.75rem]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Teslimat ve fatura süreçlerinde kullanılacak adres bilgilerini eksiksiz girin.</DialogDescription>
          </DialogHeader>
          <AddressForm
            key={editingAddress?.id ?? "new-address"}
            initialValue={editingAddress}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            submitting={createAddress.isPending || updateAddress.isPending}
          />
        </DialogContent>
      </Dialog>
    </AccountLayout>
  );
}


