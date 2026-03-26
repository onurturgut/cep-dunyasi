"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoles } from "@/hooks/use-admin";

export default function AdminRoles() {
  const { data } = useRoles();
  const roles = data?.roles ?? [];
  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Roller ve Yetkiler</h1>
        <p className="text-sm text-muted-foreground">Mevcut rol presetlerini ve atanan admin kullanicilarini goruntuleyin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rol Matrisi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Yetkiler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role: { role: string; permissions: string[] }) => (
                <TableRow key={role.role}>
                  <TableCell className="font-medium">{role.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yetkili Kullanicilar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanici</TableHead>
                <TableHead>Roller</TableHead>
                <TableHead>Ek Yetkiler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: { id: string; fullName: string; email: string; roles: string[]; permissions: string[] }) => (
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
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    Yetkili kullanici kaydi bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
