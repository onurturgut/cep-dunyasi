"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CorporatePagesTable } from "@/components/admin/corporate/CorporatePagesTable";
import { CorporatePageEditor } from "@/components/admin/corporate/CorporatePageEditor";
import { FaqItemsEditor } from "@/components/admin/corporate/FaqItemsEditor";
import { useAdminCorporatePage, useAdminCorporatePages, useUpsertCorporatePage } from "@/hooks/use-corporate-pages";
import type { CorporatePageKey, CorporatePageRecord, CorporatePageUpsertInput } from "@/types/corporate-page";

export function CorporatePagesManager() {
  const pagesQuery = useAdminCorporatePages();
  const [selectedKey, setSelectedKey] = useState<CorporatePageKey | null>(null);
  const pageQuery = useAdminCorporatePage(selectedKey);
  const upsertPage = useUpsertCorporatePage();
  const [draft, setDraft] = useState<CorporatePageRecord | null>(null);

  useEffect(() => {
    if (!selectedKey && pagesQuery.data && pagesQuery.data.length > 0) {
      setSelectedKey(pagesQuery.data[0].key);
    }
  }, [pagesQuery.data, selectedKey]);

  useEffect(() => {
    setDraft(null);
  }, [selectedKey]);

  useEffect(() => {
    if (pageQuery.data) {
      setDraft(pageQuery.data);
    }
  }, [pageQuery.data]);

  const isLoading = pagesQuery.isLoading || (selectedKey !== null && pageQuery.isLoading && !draft);
  const selectedPage = useMemo(() => draft ?? pageQuery.data ?? null, [draft, pageQuery.data]);

  if (pagesQuery.error || pageQuery.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kurumsal ve Yasal Sayfalar</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Kurumsal sayfalar yüklenirken bir hata oluştu. Sayfayı yenileyip tekrar deneyin.
        </CardContent>
      </Card>
    );
  }

  const handleSave = async (payload: CorporatePageUpsertInput) => {
    try {
      const nextPage = await upsertPage.mutateAsync(payload);
      setDraft(nextPage);
      toast.success("Kurumsal sayfa kaydedildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kurumsal sayfa kaydedilemedi");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kurumsal ve Yasal Sayfalar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">Kurumsal ve Yasal Sayfalar</h2>
        <p className="text-sm text-muted-foreground">Hakkımızda, iletişim, yasal metinler ve SSS içeriklerini tek yerden yönetin.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <CorporatePagesTable items={pagesQuery.data ?? []} selectedKey={selectedKey} onSelect={setSelectedKey} />

        {selectedPage ? (
          <div className="space-y-6">
            <CorporatePageEditor value={selectedPage} saving={upsertPage.isPending} onChange={setDraft} onSave={handleSave} />
            {selectedPage.key === "faq" ? <FaqItemsEditor items={selectedPage.faqItems} /> : null}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Düzenlemek için bir sayfa seçin.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
