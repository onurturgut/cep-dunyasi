"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { FavoritesSection } from "@/components/account/FavoritesSection";
import { useAuth } from "@/hooks/use-auth";

export default function Favorites() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, navigate, user]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Favorilerim</h1>
            <p className="text-sm text-muted-foreground">Beğendiğiniz ürünleri buradan takip edebilirsiniz.</p>
          </div>
        </div>

        <FavoritesSection className="mt-8" title="Kaydettiğin Ürünler" />
      </div>
    </Layout>
  );
}
