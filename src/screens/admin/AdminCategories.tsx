"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { db } from "@/integrations/mongo/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMediaUrls, diffRemovedMediaUrls } from "@/lib/admin-media";

type CategoryForm = {
  name: string;
  slug: string;
  icon: string;
  description: string;
  image_url: string;
};

const iconOptions = ["Smartphone", "Watch", "ShieldCheck", "BatteryCharging", "Battery", "Wrench"];

const defaultForm: CategoryForm = {
  name: "",
  slug: "",
  icon: "Smartphone",
  description: "",
  image_url: "",
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<CategoryForm>(defaultForm);

  const fetchCategories = async () => {
    const { data, error } = await db.from("categories").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
  };

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", "image");
    body.append("scope", "categories");

    const response = await fetch("/api/upload", {
      method: "POST",
      body,
    });

    const payload = await response.json();

    if (!response.ok || payload?.error) {
      throw new Error(payload?.error?.message || "Görsel yüklenemedi");
    }

    const url = payload?.data?.url;
    if (!url) {
      throw new Error("Yükleme tamamlandı ama URL dönmedi");
    }

    return `${url}`;
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setUploadingImage(true);
      const url = await uploadImage(file);
      setForm((current) => ({ ...current, image_url: url }));
      toast.success("Kategori görseli yüklendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Görsel yükleme hatası");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!form.name.trim()) {
      toast.error("Kategori adi zorunlu");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug,
      icon: form.icon,
      description: form.description.trim(),
      image_url: form.image_url.trim(),
    };

    if (editing) {
      const previousImageUrl = editing.image_url || "";
      const { error } = await db.from("categories").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      const removedUrls = diffRemovedMediaUrls([previousImageUrl], [payload.image_url]);
      if (removedUrls.length > 0) {
        try {
          await deleteMediaUrls(removedUrls);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Eski kategori görseli silinemedi");
        }
      }
      toast.success("Kategori güncellendi");
    } else {
      const { error } = await db.from("categories").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Kategori eklendi");
    }

    setDialogOpen(false);
    setEditing(null);
    resetForm();
    fetchCategories();
  };

  const handleEdit = (category: any) => {
    setEditing(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      icon: category.icon || "Smartphone",
      description: category.description || "",
      image_url: category.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((item) => item.id === id);
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (category?.image_url) {
      try {
        await deleteMediaUrls([category.image_url]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Kategori görseli silinemedi");
      }
    }
    toast.success("Kategori silindi");
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Kategoriler</h1>
          <p className="text-sm text-muted-foreground">Kategori bilgileri ve görselleri admin panelden R2 üzerinden yönetilir.</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Kategori Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Kategori Duzenle" : "Yeni Kategori"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Adi</Label>
                <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>İkon</Label>
                <Select value={form.icon} onValueChange={(value) => setForm((current) => ({ ...current, icon: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Görsel URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm((current) => ({ ...current, image_url: e.target.value }))}
                  placeholder="https://..."
                />
                <Input type="file" accept="image/*" onChange={handleImageChange} disabled={uploadingImage} />
                {uploadingImage ? <p className="text-xs text-muted-foreground">Görsel yükleniyor...</p> : null}
              </div>

              {form.image_url ? (
                <Card className="overflow-hidden">
                  <img src={form.image_url} alt={form.name || "Kategori görseli"} className="h-40 w-full object-cover" />
                </Card>
              ) : null}

              <Button className="w-full" onClick={handleSave} disabled={uploadingImage}>
                {editing ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>İkon</TableHead>
              <TableHead>Görsel</TableHead>
              <TableHead className="w-[120px]">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{category.name}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{category.description || "-"}</div>
                  </div>
                </TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.icon || "-"}</TableCell>
                <TableCell>{category.image_url ? "Var" : "Yok"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
