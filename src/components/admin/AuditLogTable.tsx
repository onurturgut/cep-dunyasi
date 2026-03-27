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
      <CardContent className="space-y-3">
        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.actionType}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.actorEmail ?? item.actorUserId}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.entityType}</p>
              <p className="mt-2 text-sm">{item.message}</p>
            </div>
          ))}
          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Audit log kaydi bulunmuyor.</p> : null}
        </div>

        <div className="hidden md:block">
          <Table className="min-w-[860px]">
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
        </div>
      </CardContent>
    </Card>
  );
}
