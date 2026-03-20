"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { db } from '@/integrations/mongo/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  brand: string;
  type: 'phone' | 'accessory' | 'service';
  category_id: string;
  is_active: boolean;
  variantSku: string;
  variantPrice: string;
  variantStock: string;
  images: string[];
};

const defaultForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  brand: '',
  type: 'accessory',
  category_id: '',
  is_active: true,
  variantSku: '',
  variantPrice: '',
  variantStock: '10',
  images: [],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [form, setForm] = useState<ProductForm>(defaultForm);

  const fetchProducts = async () => {
    const { data } = await db
      .from('products')
      .select('*, product_variants(*), categories(name)')
      .order('created_at', { ascending: false });
    setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
    db.from('categories').select('*').then(({ data }) => setCategories(data || []));
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
  };

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    body.append('kind', 'image');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body,
    });

    const payload = await response.json();

    if (!response.ok || payload?.error) {
      throw new Error(payload?.error?.message || 'Foto yuklenemedi');
    }

    const url = payload?.data?.url;
    if (!url) {
      throw new Error('Yukleme tamamlandi ama URL donmedi');
    }

    return `${url}`;
  };

  const handleImageFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    try {
      setUploadingImages(true);
      const uploadedUrls = await Promise.all(files.map((file) => uploadImage(file)));
      setForm((current) => ({
        ...current,
        images: Array.from(new Set([...current.images, ...uploadedUrls])),
      }));
      toast.success(`${uploadedUrls.length} foto yuklendi`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Foto yukleme hatasi');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((url) => url !== imageUrl),
    }));
  };

  const handleSave = async () => {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (editing) {
      const { error } = await db
        .from('products')
        .update({
          name: form.name,
          slug,
          description: form.description,
          brand: form.brand,
          type: form.type,
          category_id: form.category_id || null,
          is_active: form.is_active,
          images: form.images,
        })
        .eq('id', editing.id);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Urun guncellendi');
    } else {
      if (!form.variantSku.trim() || !form.variantPrice.trim()) {
        toast.error('Urun yayinlamak icin varsayilan varyant SKU ve fiyat zorunlu');
        return;
      }

      const parsedPrice = Number.parseFloat(form.variantPrice);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        toast.error('Varyant fiyati 0 dan buyuk olmali');
        return;
      }

      const parsedStock = Number.parseInt(form.variantStock, 10);
      if (!Number.isFinite(parsedStock) || parsedStock <= 0) {
        toast.error('Varyant stogu 1 veya daha fazla olmali');
        return;
      }

      const { data: product, error } = await db
        .from('products')
        .insert({
          name: form.name,
          slug,
          description: form.description,
          brand: form.brand,
          type: form.type,
          category_id: form.category_id || null,
          is_active: form.is_active,
          images: form.images,
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (form.variantSku && form.variantPrice) {
        await db.from('product_variants').insert({
          product_id: product.id,
          sku: form.variantSku,
          price: parsedPrice,
          stock: parsedStock,
        });
      }
      toast.success('Urun eklendi');
    }

    setDialogOpen(false);
    setEditing(null);
    resetForm();
    fetchProducts();
  };

  const handleEdit = (product: any) => {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      brand: product.brand || '',
      type: product.type,
      category_id: product.category_id || '',
      is_active: product.is_active,
      variantSku: '',
      variantPrice: '',
      variantStock: '10',
      images: Array.isArray(product.images) ? product.images : [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await db.from('products').delete().eq('id', id);
    toast.success('Urun silindi');
    fetchProducts();
  };

  const categoryIdSet = useMemo(() => new Set(categories.map((category) => category.id)), [categories]);

  const categoryFilters = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorizedCount = 0;

    products.forEach((product) => {
      const categoryId = product.category_id;
      if (!categoryId || !categoryIdSet.has(categoryId)) {
        uncategorizedCount += 1;
        return;
      }
      counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
    });

    const filters = categories.map((category) => ({
      id: category.id,
      name: category.name,
      count: counts.get(category.id) || 0,
    }));

    if (uncategorizedCount > 0) {
      filters.push({ id: 'uncategorized', name: 'Kategorisiz', count: uncategorizedCount });
    }

    return filters;
  }, [products, categories, categoryIdSet]);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === 'all') {
      return products;
    }

    if (activeCategoryId === 'uncategorized') {
      return products.filter((product) => !product.category_id || !categoryIdSet.has(product.category_id));
    }

    return products.filter((product) => product.category_id === activeCategoryId);
  }, [activeCategoryId, products, categoryIdSet]);

  const activeCategoryLabel = useMemo(() => {
    if (activeCategoryId === 'all') return 'Tum Kategoriler';
    if (activeCategoryId === 'uncategorized') return 'Kategorisiz';
    return categoryFilters.find((category) => category.id === activeCategoryId)?.name || 'Kategori';
  }, [activeCategoryId, categoryFilters]);

  useEffect(() => {
    if (activeCategoryId === 'all') return;
    const exists = categoryFilters.some((category) => category.id === activeCategoryId);
    if (!exists) {
      setActiveCategoryId('all');
    }
  }, [activeCategoryId, categoryFilters]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Urunler</h1>
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
              <Plus className="mr-1 h-4 w-4" /> Urun Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Urun Duzenle' : 'Yeni Urun'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Urun Adi</Label>
                <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marka</Label>
                  <Input value={form.brand} onChange={(e) => setForm((current) => ({ ...current, brand: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tur</Label>
                  <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value as ProductForm['type'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Telefon</SelectItem>
                      <SelectItem value="accessory">Aksesuar</SelectItem>
                      <SelectItem value="service">Servis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.category_id || 'none'}
                  onValueChange={(value) => setForm((current) => ({ ...current, category_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Secin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategorisiz</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urun Fotograflari</Label>
                <Input type="file" accept="image/*" multiple onChange={handleImageFilesChange} disabled={uploadingImages} />
                <p className="text-xs text-muted-foreground">
                  {uploadingImages
                    ? 'Fotograflar yukleniyor...'
                    : 'Birden fazla fotograf secerek urune gorsel ekleyebilirsiniz.'}
                </p>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {form.images.map((imageUrl) => (
                      <div key={imageUrl} className="relative overflow-hidden rounded-md border">
                        <img src={imageUrl} alt="Urun fotografigi" className="h-20 w-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6"
                          onClick={() => handleRemoveImage(imageUrl)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Aciklama</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                />
              </div>

              {!editing && (
                <>
                  <h4 className="text-sm font-semibold">Varsayilan Varyant</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">SKU</Label>
                      <Input
                        value={form.variantSku}
                        onChange={(e) => setForm((current) => ({ ...current, variantSku: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fiyat (TL)</Label>
                      <Input
                        type="number"
                        value={form.variantPrice}
                        onChange={(e) => setForm((current) => ({ ...current, variantPrice: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stok</Label>
                      <Input
                        type="number"
                        value={form.variantStock}
                        onChange={(e) => setForm((current) => ({ ...current, variantStock: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button className="w-full" onClick={handleSave}>
                {editing ? 'Guncelle' : 'Kaydet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" variant={activeCategoryId === 'all' ? 'default' : 'outline'} onClick={() => setActiveCategoryId('all')}>
          Tumu
          <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{products.length}</span>
        </Button>
        {categoryFilters.map((category) => (
          <Button
            key={category.id}
            size="sm"
            variant={activeCategoryId === category.id ? 'default' : 'outline'}
            onClick={() => setActiveCategoryId(category.id)}
          >
            {category.name}
            <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{category.count}</span>
          </Button>
        ))}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {activeCategoryLabel}: {filteredProducts.length} urun
      </div>

      <Card className="mt-6 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Urun</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Varyant</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Islem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                </TableCell>
                <TableCell>{product.categories?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.type}</Badge>
                </TableCell>
                <TableCell>{product.product_variants?.length || 0} varyant</TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Aktif' : 'Pasif'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Bu kategoride urun yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
