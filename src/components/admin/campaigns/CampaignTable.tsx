"use client";

import { GripVertical, PencilLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignRecord } from "@/lib/campaigns";

type CampaignTableProps = {
  campaigns: CampaignRecord[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDropOn: (id: string) => void;
  onDragEnd: () => void;
  onEdit: (campaign: CampaignRecord) => void;
  onDelete: (campaign: CampaignRecord) => void;
  onToggleActive: (campaign: CampaignRecord) => void;
  togglingId?: string | null;
};

function formatSchedule(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return "Surekli";
  }

  if (startDate && endDate) {
    return `${new Date(startDate).toLocaleDateString("tr-TR")} - ${new Date(endDate).toLocaleDateString("tr-TR")}`;
  }

  if (startDate) {
    return `${new Date(startDate).toLocaleDateString("tr-TR")} baslangic`;
  }

  return `${new Date(endDate as string).toLocaleDateString("tr-TR")} bitis`;
}

export function CampaignTable({
  campaigns,
  draggingId,
  onDragStart,
  onDropOn,
  onDragEnd,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId,
}: CampaignTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Sira</TableHead>
            <TableHead>Kampanya</TableHead>
            <TableHead>Tarih Plani</TableHead>
            <TableHead className="w-36">Durum</TableHead>
            <TableHead className="w-40 text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign, index) => (
            <TableRow
              key={campaign.id}
              draggable
              onDragStart={() => onDragStart(campaign.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropOn(campaign.id)}
              onDragEnd={onDragEnd}
              className={draggingId === campaign.id ? "bg-muted/60" : ""}
            >
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  <span>{index + 1}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img src={campaign.imageUrl} alt={campaign.title} className="h-14 w-20 rounded-xl object-cover" loading="lazy" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{campaign.title}</p>
                    <p className="text-sm text-muted-foreground">{campaign.subtitle || "Alt baslik eklenmedi"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatSchedule(campaign.startDate, campaign.endDate)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Switch checked={campaign.isActive} onCheckedChange={() => onToggleActive(campaign)} disabled={togglingId === campaign.id} />
                  <Badge variant={campaign.isActive ? "default" : "secondary"}>{campaign.isActive ? "Aktif" : "Pasif"}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(campaign)}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Duzenle
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(campaign)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
