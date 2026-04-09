"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, MessageSquareMore, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import {
  useAdminReviews,
  useApproveReview,
  useDeleteReview,
  useReplyReview,
} from "@/hooks/use-reviews";
import type { AdminReviewStatus, ProductReviewListItem, ReviewSort } from "@/lib/reviews";

export default function AdminReviews() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AdminReviewStatus>("pending");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [selectedReview, setSelectedReview] = useState<ProductReviewListItem | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const reviewsQuery = useAdminReviews({
    page,
    limit: 20,
    status,
    search: search || undefined,
    sort,
  });
  const approveReview = useApproveReview();
  const deleteReview = useDeleteReview();
  const replyReview = useReplyReview();

  const reviews = useMemo(() => reviewsQuery.data?.items ?? [], [reviewsQuery.data?.items]);

  useEffect(() => {
    setReplyMessage(selectedReview?.admin_reply?.message ?? "");
  }, [selectedReview]);

  const headerSummary = useMemo(() => {
    const pendingCount = reviews.filter((review) => !review.is_approved).length;
    const verifiedCount = reviews.filter((review) => review.is_verified_purchase).length;

    return {
      total: reviewsQuery.data?.total ?? 0,
      pendingCount,
      verifiedCount,
    };
  }, [reviews, reviewsQuery.data?.total]);

  const handleApprove = async (reviewId: string, isApproved = true) => {
    try {
      await approveReview.mutateAsync({ reviewId, isApproved });
      toast.success(isApproved ? "Yorum onaylandı" : "Yorum yayından kaldırıldı");
      if (selectedReview?.id === reviewId) {
        setSelectedReview((current) => (current ? { ...current, is_approved: isApproved } : current));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yorum durumu güncellenemedi");
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview.mutateAsync({ reviewId });
      toast.success("Yorum silindi");
      if (selectedReview?.id === reviewId) {
        setSelectedReview(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yorum silinemedi");
    }
  };

  const handleReplySave = async () => {
    if (!selectedReview) {
      return;
    }

    try {
      const result = await replyReview.mutateAsync({
        reviewId: selectedReview.id,
        message: replyMessage.trim() || null,
      });
      toast.success(replyMessage.trim() ? "Admin cevabi kaydedildi" : "Admin cevabi temizlendi");
      setSelectedReview((current) =>
        current && current.id === selectedReview.id
          ? {
              ...current,
              admin_reply: result.adminReply ?? null,
            }
          : current
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Admin cevabi kaydedilemedi");
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Yorumlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ürün yorumlarini onaylayin, yanitlayin ve yonetin.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Sonuc</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{headerSummary.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{headerSummary.pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dogrulanmis Satin Alma</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{headerSummary.verifiedCount}</CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/70">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="space-y-2">
            <Label htmlFor="review-search">Ara</Label>
            <Input
              id="review-search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Ürün, kullanici veya yorum ara"
            />
          </div>
          <div className="space-y-2">
            <Label>Durum</Label>
            <Select
              value={status}
              onValueChange={(nextStatus) => {
                setPage(1);
                setStatus(nextStatus as AdminReviewStatus);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Onay Bekleyen</SelectItem>
                <SelectItem value="approved">Onayli</SelectItem>
                <SelectItem value="all">Tümü</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Siralama</Label>
            <Select
              value={sort}
              onValueChange={(nextSort) => {
                setPage(1);
                setSort(nextSort as ReviewSort);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeni</SelectItem>
                <SelectItem value="highest">En Yüksek Puan</SelectItem>
                <SelectItem value="lowest">En Dusuk Puan</SelectItem>
                <SelectItem value="most_helpful">En Faydali</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Kullanici</TableHead>
              <TableHead>Puan</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Dogrulama</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Islem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div className="min-w-[180px]">
                    <p className="font-medium">{review.product_name || "Ürün"}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{review.title || review.comment}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{review.user_full_name || review.author_name}</p>
                    <p className="text-xs text-muted-foreground">{review.user_email || "-"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <ReviewStars rating={review.rating} />
                </TableCell>
                <TableCell>
                  <Badge variant={review.is_approved ? "default" : "secondary"}>{review.is_approved ? "Onayli" : "Bekliyor"}</Badge>
                </TableCell>
                <TableCell>
                  {review.is_verified_purchase ? (
                    <Badge variant="secondary">
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{new Date(review.created_at).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!review.is_approved ? (
                      <Button size="sm" onClick={() => handleApprove(review.id, true)} disabled={approveReview.isPending}>
                        Onayla
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleApprove(review.id, false)} disabled={approveReview.isPending}>
                        Kaldir
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setSelectedReview(review)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(review.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!reviewsQuery.isLoading && reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Filtrelere uygun yorum bulunamadı.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {(reviewsQuery.data?.totalPages ?? 1) > 1 ? (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Sayfa {reviewsQuery.data?.page ?? 1} / {reviewsQuery.data?.totalPages ?? 1}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={(reviewsQuery.data?.page ?? 1) <= 1}>
              Onceki
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((current) => Math.min(reviewsQuery.data?.totalPages ?? current, current + 1))}
              disabled={(reviewsQuery.data?.page ?? 1) >= (reviewsQuery.data?.totalPages ?? 1)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(selectedReview)} onOpenChange={(open) => (!open ? setSelectedReview(null) : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {selectedReview ? (
            <>
              <DialogHeader>
                <DialogTitle>Yorum Detayi</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selectedReview.is_approved ? "default" : "secondary"}>
                      {selectedReview.is_approved ? "Onayli" : "Bekliyor"}
                    </Badge>
                    {selectedReview.is_verified_purchase ? <Badge variant="secondary">Dogrulanmis Satin Alma</Badge> : null}
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ürün</p>
                      <p className="mt-1 font-medium">{selectedReview.product_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Kullanici</p>
                      <p className="mt-1 font-medium">{selectedReview.user_full_name || selectedReview.author_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedReview.user_email || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <ReviewStars rating={selectedReview.rating} />
                  {selectedReview.title ? <h3 className="text-lg font-semibold">{selectedReview.title}</h3> : null}
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{selectedReview.comment}</p>
                </div>

                {selectedReview.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {selectedReview.images.map((imageUrl) => (
                      <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-border/70">
                        <img src={imageUrl} alt="Review media" className="h-24 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="admin-reply" className="flex items-center gap-2">
                    <MessageSquareMore className="h-4 w-4" />
                    Admin Cevabi
                  </Label>
                  <Textarea
                    id="admin-reply"
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    placeholder="Yoruma cevap yazin"
                    maxLength={1500}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {!selectedReview.is_approved ? (
                    <Button onClick={() => handleApprove(selectedReview.id, true)} disabled={approveReview.isPending}>
                      Onayla
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => handleApprove(selectedReview.id, false)} disabled={approveReview.isPending}>
                      Yorumu Kaldir
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleReplySave} disabled={replyReview.isPending}>
                    Cevabi Kaydet
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(selectedReview.id)} disabled={deleteReview.isPending}>
                    Sil
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}


