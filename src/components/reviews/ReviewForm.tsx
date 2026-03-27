"use client";

import { useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const handleUpload = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (images.length + selectedFiles.length > REVIEW_IMAGE_LIMIT) {
      toast.error(`En fazla ${REVIEW_IMAGE_LIMIT} g\u00f6rsel y\u00fckleyebilirsiniz`);
      return;
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        toast.error("Sadece g\u00f6rsel dosyas\u0131 y\u00fckleyebilirsiniz");
        return;
      }

      if (file.size > MAX_REVIEW_IMAGE_SIZE_BYTES) {
        toast.error("Her g\u00f6rsel en fazla 6MB olabilir");
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
            throw new Error(payload?.error?.message || "G\u00f6rsel y\u00fcklenemedi");
          }

          return `${payload?.data?.url ?? ""}`.trim();
        }),
      );

      setImages((current) => Array.from(new Set([...current, ...uploadedUrls.filter(Boolean)])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "G\u00f6rsel y\u00fckleme hatas\u0131");
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
      toast.error(error instanceof Error ? error.message : "Yorum g\u00f6nderilemedi");
    }
  };

  if (viewerReviewStatus === "approved") {
    return (
      <Card className="border-border/70">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Bu \u00fcr\u00fcn i\u00e7in daha \u00f6nce yorum b\u0131rakt\u0131n\u0131z. G\u00fcncelleme gerekiyorsa destek ekibimizle ileti\u015fime ge\u00e7ebilirsiniz.
        </CardContent>
      </Card>
    );
  }

  if (viewerReviewStatus === "pending") {
    return (
      <Card className="border-border/70">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Bu \u00fcr\u00fcn i\u00e7in yorumunuz inceleme bekliyor. Onayland\u0131\u011f\u0131nda bu alanda yay\u0131na al\u0131nacakt\u0131r.
        </CardContent>
      </Card>
    );
  }

  if (!canReview) {
    return (
      <Card className="border-border/70">
        <CardContent className="p-5 text-sm text-muted-foreground">
          {reviewReason === "not_delivered"
            ? "Yorum b\u0131rakmak i\u00e7in sipari\u015finizin teslim edilmesini beklemelisiniz."
            : "Yorum b\u0131rakmak i\u00e7in \u00f6nce bu \u00fcr\u00fcn\u00fc sat\u0131n al\u0131p teslim alman\u0131z gerekiyor."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">Yorum B\u0131rak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block text-sm">Puan\u0131n\u0131z</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} y\u0131ld\u0131z`}
                onClick={() => setRating(value)}
                className="rounded-full p-1 transition-transform hover:scale-105"
              >
                <Star className={`h-6 w-6 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="review-title">Ba\u015fl\u0131k</Label>
            <Input id="review-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="K\u0131sa bir ba\u015fl\u0131k ekleyin" maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-images">Yorum G\u00f6rselleri</Label>
            <Input id="review-images" type="file" accept="image/*" multiple onChange={(event) => handleUpload(event.target.files)} disabled={uploading} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-comment">Yorumunuz</Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="\u00dcr\u00fcn hakk\u0131ndaki deneyiminizi yaz\u0131n"
            minLength={5}
            maxLength={2000}
          />
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((imageUrl) => (
              <div key={imageUrl} className="relative overflow-hidden rounded-xl border border-border/70">
                <img src={imageUrl} alt="Y\u00fcklenen yorum g\u00f6rseli" className="h-24 w-full object-cover" />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-2 h-7 w-7"
                  onClick={() => setImages((current) => current.filter((url) => url !== imageUrl))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              En fazla {REVIEW_IMAGE_LIMIT} g\u00f6rsel ekleyebilirsiniz.
            </div>
          </div>
        )}

        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={handleSubmit}
          disabled={createReview.isPending || uploading || comment.trim().length < 5}
        >
          {createReview.isPending || uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              G\u00f6nderiliyor
            </>
          ) : (
            "Yorumu G\u00f6nder"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
