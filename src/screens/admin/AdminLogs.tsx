"use client";

import { useState } from "react";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuditLogs } from "@/hooks/use-admin";

export default function AdminLogs() {
  const [actionType, setActionType] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const { data } = useAuditLogs({
    page: 1,
    limit: 50,
    actionType: actionType || undefined,
    actorUserId: actorUserId || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Audit Loglari</h1>
        <p className="text-sm text-muted-foreground">Kritik admin islemlerinin kaydini takip edin.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Islem Tipi</Label>
            <Input value={actionType} onChange={(event) => setActionType(event.target.value)} placeholder="product.bulk_action" />
          </div>
          <div className="space-y-2">
            <Label>Kullanici ID</Label>
            <Input value={actorUserId} onChange={(event) => setActorUserId(event.target.value)} placeholder="Admin kullanici id" />
          </div>
        </CardContent>
      </Card>

      <AuditLogTable items={data?.items ?? []} />
    </div>
  );
}
