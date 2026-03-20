"use client";

import { type ChangeEvent, useEffect, useState } from 'react';
import { db } from '@/integrations/mongo/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type MissionForm = {
  title: string;
  description: string;
  media_type: 'image' | 'video';
  media_url: string;
  media_poster: string;
  list_items_text: string;
  sort_order: string;
  is_active: string;
};

const defaultForm: MissionForm = {
  title: '',
  description: '',
  media_type: 'image',
  media_url: '',
  media_poster: '',
  list_items_text: '',
  sort_order: '0',
  is_active: 'true',
};

export default function AdminMission() {
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<MissionForm>(defaultForm);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  const fetchItems = async () => {
    const { data, error } = await db.from('mission_items').select('*').order('sort_order', { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems(data || []);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
  };

  const toPayload = () => {
    const listItems = form.list_items_text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const sortOrder = Number.parseInt(form.sort_order, 10) || 0;
    const generatedLabel = form.title.trim().charAt(0).toUpperCase() || `${sortOrder || '?'}`;

    return {
      label: generatedLabel,
      title: form.title.trim(),
      description: form.description.trim(),
      media_type: form.media_type,
      media_url: form.media_url.trim(),
      media_poster: form.media_poster.trim(),
      list_items: listItems,
      sort_order: sortOrder,
      is_active: form.is_active === 'true',
    };
  };

  const handleSave = async () => {
    const payload = toPayload();

    if (editing) {
      const { error } = await db.from('mission_items').update(payload).eq('id', editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Misyon kaydi guncellendi');
    } else {
      const { error } = await db.from('mission_items').insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Misyon kaydi eklendi');
    }

    setDialogOpen(false);
    setEditing(null);
    resetForm();
    fetchItems();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      media_type: item.media_type === 'video' ? 'video' : 'image',
      media_url: item.media_url || '',
      media_poster: item.media_poster || '',
      list_items_text: Array.isArray(item.list_items) ? item.list_items.join('\n') : '',
      sort_order: `${item.sort_order ?? 0}`,
      is_active: item.is_active ? 'true' : 'false',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await db.from('mission_items').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Misyon kaydi silindi');
    fetchItems();
  };

  const uploadFile = async (file: File, kind: 'image' | 'video') => {
    const body = new FormData();
    body.append('file', file);
    body.append('kind', kind);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body,
    });

    const payload = await response.json();

    if (!response.ok || payload?.error) {
      throw new Error(payload?.error?.message || 'Dosya yuklenemedi');
    }

    const url = payload?.data?.url;
    if (!url) {
      throw new Error('Yukleme tamamlandi ama URL donmedi');
    }

    return `${url}`;
  };

  const handleMediaFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setUploadingMedia(true);
      const url = await uploadFile(file, form.media_type);
      setForm((current) => ({ ...current, media_url: url }));
      toast.success('Medya yuklendi ve URL alana eklendi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Medya yukleme hatasi');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePosterFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setUploadingPoster(true);
      const url = await uploadFile(file, 'image');
      setForm((current) => ({ ...current, media_poster: url }));
      toast.success('Poster yuklendi ve URL alana eklendi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Poster yukleme hatasi');
    } finally {
      setUploadingPoster(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Misyon Icerikleri</h1>
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
              <Plus className="mr-1 h-4 w-4" /> Kayit Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Misyon Kaydi Duzenle' : 'Yeni Misyon Kaydi'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Siralama</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((current) => ({ ...current, sort_order: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Baslik</Label>
                <Input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Aciklama</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medya Turu</Label>
                  <Select
                    value={form.media_type}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, media_type: value as 'image' | 'video' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Foto</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={form.is_active} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medya URL</Label>
                <Input
                  value={form.media_url}
                  onChange={(e) => setForm((current) => ({ ...current, media_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Bilgisayar/Telefon Medya Yukle</Label>
                <Input
                  type="file"
                  accept={form.media_type === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleMediaFileChange}
                  disabled={uploadingMedia}
                />
                <p className="text-xs text-muted-foreground">
                  {uploadingMedia
                    ? 'Yukleniyor...'
                    : form.media_type === 'video'
                      ? 'Video secerek Medya URL alanini otomatik doldurabilirsiniz.'
                      : 'Foto secerek Medya URL alanini otomatik doldurabilirsiniz.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Video Poster URL (opsiyonel)</Label>
                <Input
                  value={form.media_poster}
                  onChange={(e) => setForm((current) => ({ ...current, media_poster: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Bilgisayar/Telefon Poster Yukle</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterFileChange}
                  disabled={uploadingPoster}
                />
                <p className="text-xs text-muted-foreground">
                  {uploadingPoster
                    ? 'Yukleniyor...'
                    : 'Poster gorseli yukleyerek Video Poster URL alanini otomatik doldurabilirsiniz.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Metin Listesi (her satir bir metin)</Label>
                <Textarea
                  value={form.list_items_text}
                  onChange={(e) => setForm((current) => ({ ...current, list_items_text: e.target.value }))}
                  placeholder={'Urun Danismanligi\nHizli Kargo\nTeknik Destek'}
                />
              </div>

              <Button className="w-full" onClick={handleSave}>
                {editing ? 'Guncelle' : 'Kaydet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-6 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Baslik</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Sira</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Islem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title || '-'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.media_type === 'video' ? 'Video' : 'Foto'}</Badge>
                </TableCell>
                <TableCell>{item.sort_order ?? 0}</TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Aktif' : 'Pasif'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
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
