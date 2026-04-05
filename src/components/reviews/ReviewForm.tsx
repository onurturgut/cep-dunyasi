"use client";

import { useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/provider";
import { REVIEW_IMAGE_LIMIT, type ReviewEligibilityReason, type ReviewViewerStatus } from "@/lib/reviews";
import { useCreateReview } from "@/hooks/use-reviews";

type ReviewFormProps = {
  productId: string;
  viewerReviewStatus: ReviewViewerStatus;
  canReview: boolean;
  reviewReason: ReviewEligibilityReason;
};

const MAX_REVIEW_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;

export function ReviewForm({ productId, viewerReviewStatus, canReview, reviewReason }: ReviewFormProps) {
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { locale } = useI18n();

  const copy =
    locale === "en"
      ? {
          uploadLimit: `You can upload up to ${REVIEW_IMAGE_LIMIT} images`,
          imageOnly: "Only image files are allowed",
          imageSize: "Each image must be 6MB or less",
          uploadFailed: "Image upload failed",
          uploadError: "Image upload error",
          submitError: "Review could not be submitted",
          alreadyReviewed:
            "You have already left a review for this product. If you need an update, please contact our support team.",
          pendingReview: "Your review for this product is pending moderation. It will appear here once approved.",
          notDelivered: "You need to wait until your order is delivered to leave a review.",
          notPurchased: "You need to purchase and receive this product before leaving a review.",
          leaveReview: "Leave a Review",
          yourRating: "Your Rating",
          starLabel: (value: number) => `${value} stars`,
          title: "Title",
          titlePlaceholder: "Add a short title",
          images: "Review Images",
          comment: "Your Review",
          commentPlaceholder: "Write about your experience with the product",
          uploadedImage: "Uploaded review image",
          imageHint: `You can add up to ${REVIEW_IMAGE_LIMIT} images.`,
          sending: "Sending",
          submit: "Submit Review",
        }
      : {
          uploadLimit: `En fazla ${REVIEW_IMAGE_LIMIT} görsel yukleyebilirsiniz`,
          imageOnly: "Sadece görsel dosyasi yukleyebilirsiniz",
          imageSize: "Her görsel en fazla 6MB olabilir",
          uploadFailed: "Görsel yuklenemedi",
          uploadError: "Görsel yukleme hatasi",
          submitError: "Yorum gonderilemedi",
          alreadyReviewed: "Bu urun icin daha once yorum biraktiniz. Güncelleme gerekiyorsa destek ekibimizle iletisime gecebilirsiniz.",
          pendingReview: "Bu urun icin yorumunuz inceleme bekliyor. Onaylandiginda bu alanda yayina alinacaktir.",
          notDelivered: "Yorum birakmak icin siparisinizin teslim edilmesini beklemelisiniz.",
          notPurchased: "Yorum birakmak icin once bu urunu satin alip teslim almaniz gerekiyor.",
          leaveReview: "Yorum Birak",
          yourRating: "Puaniniz",
          starLabel: (value: number) => `${value} yildiz`,
          title: "Baslik",
          titlePlaceholder: "Kisa bir baslik ekleyin",
          images: "Yorum Görselleri",
          comment: "Yorumunuz",
          commentPlaceholder: "Ürün hakkindaki deneyiminizi yazin",
          uploadedImage: "Yuklenen yorum görseli",
          imageHint: `En fazla ${REVIEW_IMAGE_LIMIT} görsel ekleyebilirsiniz.`,
          sending: "Gonderiliyor",
          submit: "Yorumu Gonder",
        };

  const handleUpload = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (images.length + selectedFiles.length > REVIEW_IMAGE_LIMIT) {
      toast.error(copy.uploadLimit);
      return;
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        toast.error(copy.imageOnly);
        return;
      }

      if (file.size > MAX_REVIEW_IMAGE_SIZE_BYTES) {
        toast.error(copy.imageSize);
        return;
      }
    }

    try {
      setUploading(true);
      const uploadedUrls = await Promise.all(
        selectedFiles.map(async (file) => {
          const body = new FormData();
          body.append("file", file);
          body.append("kind", "image");
          body.append("scope", "reviews");

          const response = await fetch("/api/upload", {
            method: "POST",
            body,
          });

          const payload = await response.json().catch(() => null);
          if (!response.ok || payload?.error) {
            throw new Error(payload?.error?.message || copy.uploadFailed);
          }

          return `${payload?.data?.url ?? ""}`.trim();
        }),
      );

      setImages((current) => Array.from(new Set([...current, ...uploadedUrls.filter(Boolean)])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await createReview.mutateAsync({
        productId,
        rating,
        title: title || null,
        comment,
        images,
      });

      setRating(5);
      setTitle("");
      setComment("");
      setImages([]);
      toast.success(result.moderationMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.submitError);
    }
  };

  if (viewerReviewStatus === "approved") {
    return (
      <Card className="border-border/70">
        <CardContent className="p-5 text-sm text-muted-foreground">{copy.alreadyReviewed}</CardContent>
      </Card>
    );
  }

  if (viewerReviewStatus === "pending") {
    return (
      <Card className="border-border/70">
        <CardContent className="p-5 text-sm text-muted-foreground">{copy.pendingReview}</CardContent>
      </Card>
    );
  }

  if (!canReview) {
    return (
      <Card className="border-border/70">
        <CardContent className="p-5 text-sm text-muted-foreground">{reviewReason === "not_delivered" ? copy.notDelivered : copy.notPurchased}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">{copy.leaveReview}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block text-sm">{copy.yourRating}</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" aria-label={copy.starLabel(value)} onClick={() => setRating(value)} className="rounded-full p-1 transition-transform hover:scale-105">
                <Star className={`h-6 w-6 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-title">{copy.title}</Label>
            <Input id="review-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={copy.titlePlaceholder} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-images">{copy.images}</Label>
            <Input id="review-images" type="file" accept="image/*" multiple onChange={(event) => handleUpload(event.target.files)} disabled={uploading} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-comment">{copy.comment}</Label>
          <Textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={copy.commentPlaceholder} minLength={5} maxLength={2000} />
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((imageUrl) => (
              <div key={imageUrl} className="relative overflow-hidden rounded-xl border border-border/70">
                <img src={imageUrl} alt={copy.uploadedImage} className="h-24 w-full object-cover" />
                <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2 h-7 w-7" onClick={() => setImages((current) => current.filter((url) => url !== imageUrl))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              {copy.imageHint}
            </div>
          </div>
        )}

        <Button type="button" className="w-full sm:w-auto" onClick={handleSubmit} disabled={createReview.isPending || uploading || comment.trim().length < 5}>
          {createReview.isPending || uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {copy.sending}
            </>
          ) : (
            copy.submit
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

