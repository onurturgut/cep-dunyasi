"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { sanitizePhone, type AccountAddress } from "@/lib/account";
import { findCanonicalCity, findCanonicalDistrict, getDistrictsByCity, isDistrictInCity, turkeyCities } from "@/lib/turkey-addresses";

type AddressFormValue = Omit<AccountAddress, "id" | "created_at" | "updated_at"> & { id?: string };

type AddressFormProps = {
  initialValue?: AddressFormValue | null;
  onSubmit: (value: AddressFormValue) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
};

const defaultValue: AddressFormValue = {
  title: "",
  full_name: "",
  phone: "",
  city: "",
  district: "",
  neighborhood: "",
  address_line: "",
  postal_code: "",
  is_default: false,
};

const createFormValue = (initialValue?: AddressFormValue | null): AddressFormValue => {
  const baseValue = initialValue ? { ...defaultValue, ...initialValue } : { ...defaultValue };
  const city = findCanonicalCity(baseValue.city);
  const district = findCanonicalDistrict(city, baseValue.district);

  return {
    ...baseValue,
    city,
    district,
  };
};

export function AddressForm({ initialValue, onSubmit, onCancel, submitting }: AddressFormProps) {
  const [value, setValue] = useState<AddressFormValue>(() => createFormValue(initialValue));
  const [error, setError] = useState("");
  const districtOptions = getDistrictsByCity(value.city);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!value.title.trim() || !value.full_name.trim() || !value.phone.trim() || !value.city.trim() || !value.district.trim() || !value.neighborhood.trim() || !value.address_line.trim()) {
      setError("Lutfen zorunlu alanlari eksiksiz doldurun.");
      return;
    }

    setError("");
    await onSubmit({
      ...value,
      phone: sanitizePhone(value.phone),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address-title">Adres Basligi</Label>
          <Input id="address-title" value={value.title} onChange={(event) => setValue((current) => ({ ...current, title: event.target.value }))} placeholder="Ev, Ofis" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-full-name">Ad Soyad</Label>
          <Input id="address-full-name" value={value.full_name} onChange={(event) => setValue((current) => ({ ...current, full_name: event.target.value }))} placeholder="Teslim alacak kisi" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address-phone">Telefon</Label>
          <Input id="address-phone" value={value.phone} onChange={(event) => setValue((current) => ({ ...current, phone: sanitizePhone(event.target.value) }))} placeholder="05xx xxx xx xx" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-postal-code">Posta Kodu</Label>
          <Input id="address-postal-code" value={value.postal_code} onChange={(event) => setValue((current) => ({ ...current, postal_code: event.target.value }))} placeholder="34000" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="address-city">Sehir</Label>
          <Select
            value={value.city || undefined}
            onValueChange={(nextCity) =>
              setValue((current) => ({
                ...current,
                city: nextCity,
                district: isDistrictInCity(nextCity, current.district) ? current.district : "",
              }))
            }
          >
            <SelectTrigger id="address-city">
              <SelectValue placeholder="Sehir secin" />
            </SelectTrigger>
            <SelectContent>
              {turkeyCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-district">Ilce</Label>
          <Select value={value.district || undefined} onValueChange={(nextDistrict) => setValue((current) => ({ ...current, district: nextDistrict }))} disabled={!value.city}>
            <SelectTrigger id="address-district">
              <SelectValue placeholder={value.city ? "Ilce secin" : "Once sehir secin"} />
            </SelectTrigger>
            <SelectContent>
              {districtOptions.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-neighborhood">Mahalle</Label>
          <Input id="address-neighborhood" value={value.neighborhood} onChange={(event) => setValue((current) => ({ ...current, neighborhood: event.target.value }))} placeholder="Moda" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address-line">Adres Detayi</Label>
        <Input id="address-line" value={value.address_line} onChange={(event) => setValue((current) => ({ ...current, address_line: event.target.value }))} placeholder="Cadde, sokak, bina ve daire bilgisi" />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Varsayilan adres olarak kaydet</p>
          <p className="text-xs text-muted-foreground">Checkout sirasinda bu adres otomatik secilir.</p>
        </div>
        <Switch checked={value.is_default} onCheckedChange={(checked) => setValue((current) => ({ ...current, is_default: checked }))} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Vazgec
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor
            </>
          ) : initialValue?.id ? (
            "Adresi Guncelle"
          ) : (
            "Adresi Kaydet"
          )}
        </Button>
      </div>
    </form>
  );
}
