"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminUsers, usePermissions, useRoles, useUpdateUserRole } from "@/hooks/use-admin";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "@/lib/date";

type EditableUser = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const usersQuery = useAdminUsers({ page: 1, limit: 50, search, status });
  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const updateUserRole = useUpdateUserRole();

  const availableRoles = useMemo(() => rolesQuery.data?.roles ?? [], [rolesQuery.data]);
  const availablePermissions = useMemo(() => permissionsQuery.data ?? [], [permissionsQuery.data]);
  const users = usersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Kullanici Yönetimi</h1>
        <p className="text-sm text-muted-foreground">Kullanicilari arayin, durumlarini izleyin ve erisim duzeylerini yonetin.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_180px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Email, ad soyad veya telefon ile ara" />
          <div className="flex flex-wrap gap-2">
            <Button variant={status === "all" ? "default" : "outline"} onClick={() => setStatus("all")}>
              Tümü
            </Button>
            <Button variant={status === "active" ? "default" : "outline"} onClick={() => setStatus("active")}>
              Aktif
            </Button>
            <Button variant={status === "inactive" ? "default" : "outline"} onClick={() => setStatus("inactive")}>
              Pasif
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? "Aktif" : "Pasif"}</Badge>
              </div>

              <div className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <Badge key={role}>{role}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Siparis</p>
                  <p>{user.orderCount.toLocaleString("tr-TR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Harcama</p>
                  <p>{formatCurrency(user.totalSpend)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Son Giriş</p>
                  <p>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-"}</p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setEditingUser({
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    roles: user.roles,
                    permissions: user.permissions,
                    isActive: user.isActive,
                  })
                }
              >
                Düzenle
              </Button>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Kullanıcı bulunamadı.</CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Kullanici</TableHead>
                <TableHead>Roller</TableHead>
                <TableHead>Siparis</TableHead>
                <TableHead>Harcama</TableHead>
                <TableHead>Son Giriş</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role}>{role}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{user.orderCount.toLocaleString("tr-TR")}</TableCell>
                  <TableCell>{formatCurrency(user.totalSpend)}</TableCell>
                  <TableCell>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? "Aktif" : "Pasif"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingUser({
                          id: user.id,
                          fullName: user.fullName,
                          email: user.email,
                          roles: user.roles,
                          permissions: user.permissions,
                          isActive: user.isActive,
                        })
                      }
                    >
                      Düzenle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Kullanıcı bulunamadı.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Kullanici Erisim Ayarlari</DialogTitle>
          </DialogHeader>
          {editingUser ? (
            <div className="space-y-6">
              <div>
                <p className="font-medium">{editingUser.fullName}</p>
                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Roller</Label>
                  <div className="space-y-2">
                    {availableRoles.map((role: { role: string }) => (
                      <label key={role.role} className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                        <Checkbox
                          checked={editingUser.roles.includes(role.role)}
                          onCheckedChange={(checked) =>
                            setEditingUser((current) =>
                              current
                                ? {
                                    ...current,
                                    roles: checked
                                      ? Array.from(new Set([...current.roles, role.role]))
                                      : current.roles.filter((item) => item !== role.role),
                                  }
                                : current,
                            )
                          }
                        />
                        <span>{role.role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Ek Yetkiler</Label>
                  <div className="space-y-2">
                    {availablePermissions.map((permission: { id: string; label: string }) => (
                      <label key={permission.id} className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                        <Checkbox
                          checked={editingUser.permissions.includes(permission.id)}
                          onCheckedChange={(checked) =>
                            setEditingUser((current) =>
                              current
                                ? {
                                    ...current,
                                    permissions: checked
                                      ? Array.from(new Set([...current.permissions, permission.id]))
                                      : current.permissions.filter((item) => item !== permission.id),
                                  }
                                : current,
                            )
                          }
                        />
                        <span>{permission.id}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Hesap Durumu</p>
                  <p className="text-sm text-muted-foreground">Pasif hesaplar giriş yapamaz ve admin alanına erişemez.</p>
                </div>
                <Switch
                  checked={editingUser.isActive}
                  onCheckedChange={(checked) =>
                    setEditingUser((current) => (current ? { ...current, isActive: checked } : current))
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={async () => {
                  await updateUserRole.mutateAsync({
                    userId: editingUser.id,
                    roles: editingUser.roles,
                    permissions: editingUser.permissions,
                    isActive: editingUser.isActive,
                  });
                  toast.success("Kullanıcı yetkileri güncellendi");
                  setEditingUser(null);
                }}
              >
                Kaydet
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}


