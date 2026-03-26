"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/date";
import type { AuditLogRecord } from "@/lib/admin";

export function AuditLogTable({ items }: { items: AuditLogRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Loglari</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Kullanici</TableHead>
              <TableHead>Islem</TableHead>
              <TableHead>Kayit Tipi</TableHead>
              <TableHead>Mesaj</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                <TableCell>{item.actorEmail ?? item.actorUserId}</TableCell>
                <TableCell>{item.actionType}</TableCell>
                <TableCell>{item.entityType}</TableCell>
                <TableCell>{item.message}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Audit log kaydi bulunmuyor.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
