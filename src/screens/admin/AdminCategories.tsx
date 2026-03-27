"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/mongo/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMediaUrls, diffRemovedMediaUrls } from "@/lib/admin-media";
import { sanitizeSlug } from "@/lib/utils";

type CategoryForm = {
  name: string;
  slug: string;
  parent_category_id: string;
  icon: string;
  description: string;
  image_url: string;
};

type AdminCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parent_category_id?: string | null;
  icon?: string | null;
  description?: string | null;
  image_url?: string | null;
};

const iconOptions = ["Smartphone", "Watch", "ShieldCheck", "BatteryCharging", "Battery", "Wrench"];

const defaultForm: CategoryForm = {
  name: "",
  slug: "",
  parent_category_id: "",
  icon: "Smartphone",
  description: "",
  image_url: "",
};

function hasCustomSlug(name: string, slug: string) {
  return Boolean(slug) && slug !== sanitizeSlug(name);
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRecord | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<CategoryForm>(defaultForm);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);

  const fetchCategories = async () => {
    const { data, error } = await db.from("categories").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCategories((data || []) as AdminCategoryRecord[]);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const topLevelCategories = useMemo(
    () => categories.filter((category) => !category.parent_category_id),
    [categories],
  );

  const availableParentCategories = useMemo(
    () => topLevelCategories.filter((category) => category.id !== editing?.id),
    [editing?.id, topLevelCategories],
  );

  const childCategoriesByParentId = useMemo(() => {
    const childMap = new Map<string, AdminCategoryRecord[]>();

    categories.forEach((category) => {
      if (!category.parent_category_id || !categoryById.has(category.parent_category_id)) {
        return;
      }

      const currentChildren = childMap.get(category.parent_category_id) ?? [];
      currentChildren.push(category);
      childMap.set(category.parent_category_id, currentChildren);
    });

    childMap.forEach((items, parentId) => {
      childMap.set(parentId, [...items].sort((first, second) => first.name.localeCompare(second.name, "tr")));
    });

    return childMap;
  }, [categories, categoryById]);

  const editingHasChildCategories = useMemo(
    () => (editing ? categories.some((category) => category.parent_category_id === editing.id) : false),
    [categories, editing],
  );

  const resetForm = () => {
    setForm(defaultForm);
    setIsSlugManuallyEdited(false);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value;

    setForm((current) => {
      const shouldSyncSlug = !isSlugManuallyEdited || !current.slug || !hasCustomSlug(current.name, current.slug);

      return {
        ...current,
        name: nextName,
        slug: shouldSyncSlug ? sanitizeSlug(nextName) : current.slug,
      };
    });
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSlug = sanitizeSlug(event.currentTarget.value);
    event.currentTarget.value = nextSlug;
    setIsSlugManuallyEdited(hasCustomSlug(form.name, nextSlug));
    setForm((current) => ({
      ...current,
      slug: nextSlug,
    }));
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
      throw new Error(payload?.error?.message || "Gorsel yuklenemedi");
    }

    const url = payload?.data?.url;
    if (!url) {
      throw new Error("Yukleme tamamlandi ama URL donmedi");
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
      toast.success("Kategori gorseli yuklendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gorsel yukleme hatasi");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const slug = sanitizeSlug(form.slug || form.name);

    if (!form.name.trim()) {
      toast.error("Kategori adi zorunlu");
      return;
    }

    if (!slug) {
      toast.error("Kategori icin gecerli bir slug olusturulamadi");
      return;
    }

    if (form.parent_category_id) {
      const parentCategory = categoryById.get(form.parent_category_id);

      if (!parentCategory) {
        toast.error("Secilen ana kategori bulunamadi");
        return;
      }

      if (parentCategory.parent_category_id) {
        toast.error("Alt kategori icin sadece ust seviye bir ana kategori secilebilir");
        return;
      }
    }

    if (editingHasChildCategories && form.parent_category_id) {
      toast.error("Alt kategorileri olan bir ana kategori, alt kategoriye donusturulemez");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug,
      parent_category_id: form.parent_category_id || null,
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
          toast.error(error instanceof Error ? error.message : "Eski kategori gorseli silinemedi");
        }
      }
      toast.success("Kategori guncellendi");
    } else {
      const { error } = await db.from("categories").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(form.parent_category_id ? "Alt kategori eklendi" : "Kategori eklendi");
    }

    setDialogOpen(false);
    setEditing(null);
    resetForm();
    fetchCategories();
  };

  const handleEdit = (category: AdminCategoryRecord) => {
    const nextForm = {
      name: category.name || "",
      slug: sanitizeSlug(category.slug || category.name || ""),
      parent_category_id: category.parent_category_id || "",
      icon: category.icon || "Smartphone",
      description: category.description || "",
      image_url: category.image_url || "",
    };

    setEditing(category);
    setForm(nextForm);
    setIsSlugManuallyEdited(hasCustomSlug(nextForm.name, nextForm.slug));
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((item) => item.id === id) ?? null;

    if (categories.some((item) => item.parent_category_id === id)) {
      toast.error("Bu kategoriye bagli alt kategoriler var. Once alt kategorileri silin veya tasiyin.");
      return;
    }

    const { error } = await db.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (category?.image_url) {
      try {
        await deleteMediaUrls([category.image_url]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Kategori gorseli silinemedi");
      }
    }
    toast.success("Kategori silindi");
    fetchCategories();
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Kategoriler</h1>
          <p className="text-sm text-muted-foreground">Ana kategori ve alt kategori yapisini bu ekrandan yonetebilirsiniz.</p>
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
                <Input value={form.name} onChange={handleNameChange} />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="kategori-slug-alani"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="url"
                />
                <p className="text-xs text-muted-foreground">Bosluk, buyuk harf ve Turkce karakterler otomatik duzeltilir.</p>
              </div>

              <div className="space-y-2">
                <Label>Ana Kategori</Label>
                <Select
                  value={form.parent_category_id || "none"}
                  onValueChange={(value) => setForm((current) => ({ ...current, parent_category_id: value === "none" ? "" : value }))}
                  disabled={editingHasChildCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Secin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ust seviye kategori</SelectItem>
                    {availableParentCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {editingHasChildCategories
                    ? "Bu kategorinin alt kategorileri oldugu icin ana kategoriye baglanamaz."
                    : "Alt kategori olusturmak icin buradan bagli olacagi ana kategoriyi secin."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Ikon</Label>
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
                <Label>Aciklama</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Gorsel URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                  placeholder="https://..."
                />
                <Input type="file" accept="image/*" onChange={handleImageChange} disabled={uploadingImage} />
                {uploadingImage ? <p className="text-xs text-muted-foreground">Gorsel yukleniyor...</p> : null}
              </div>

              {form.image_url ? (
                <Card className="overflow-hidden">
                  <img src={form.image_url} alt={form.name || "Kategori gorseli"} className="h-40 w-full object-cover" />
                </Card>
              ) : null}

              <Button className="w-full" onClick={handleSave} disabled={uploadingImage}>
                {editing ? "Guncelle" : "Kaydet"}
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
              <TableHead>Tip</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ikon</TableHead>
              <TableHead>Gorsel</TableHead>
              <TableHead className="w-[160px] text-right">Islem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topLevelCategories.map((category) => {
              const childCategories = childCategoriesByParentId.get(category.id) ?? [];
              const isExpanded = expandedCategoryIds.includes(category.id);

              return (
                <>
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{category.name}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">{category.description || "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell>Ana Kategori</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>{category.icon || "-"}</TableCell>
                    <TableCell>{category.image_url ? "Var" : "Yok"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {childCategories.length > 0 ? (
                          <Button variant="ghost" size="icon" onClick={() => toggleCategoryExpansion(category.id)} title="Alt kategorileri goster">
                            {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded
                    ? childCategories.map((childCategory) => (
                        <TableRow key={childCategory.id} className="bg-muted/20">
                          <TableCell>
                            <div className="space-y-1 pl-6">
                              <div className="font-medium">{childCategory.name}</div>
                              <div className="line-clamp-2 text-xs text-muted-foreground">{childCategory.description || "-"}</div>
                            </div>
                          </TableCell>
                          <TableCell>Alt Kategori</TableCell>
                          <TableCell>{childCategory.slug}</TableCell>
                          <TableCell>{childCategory.icon || "-"}</TableCell>
                          <TableCell>{childCategory.image_url ? "Var" : "Yok"}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(childCategory)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(childCategory.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : null}
                </>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
