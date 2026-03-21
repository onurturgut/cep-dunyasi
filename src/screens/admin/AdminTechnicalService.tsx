"use client";

import { useEffect, useState } from "react";
import { Eye, Phone, Smartphone } from "lucide-react";
import { db } from "@/integrations/mongo/client";
import { formatDateTime } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type TechnicalServiceRequest = {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  phone_model: string;
  issue_description: string;
  photo_url?: string;
  photo_name?: string;
  status?: string;
  created_at: string;
};

export default function AdminTechnicalService() {
  const [requests, setRequests] = useState<TechnicalServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("technical_service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setRequests((data as TechnicalServiceRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Teknik Servis Talepleri</h1>
          <p className="mt-1 text-sm text-muted-foreground">Müşteri formundan gelen teknik servis kayıtlari burada listelenir.</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {loading ? "Yükleniyor..." : `${requests.length} talep`}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Talep</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "..." : requests.length.toLocaleString("tr-TR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fotoğraflı Kayıt</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {loading ? "..." : requests.filter((item) => Boolean(item.photo_url)).length.toLocaleString("tr-TR")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Son Kayit</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">
              {loading ? "..." : requests[0] ? formatDateTime(requests[0].created_at) : "Kayit yok"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Gelen Formlar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Detay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Henüz teknik servis talebi yok.
                  </TableCell>
                </TableRow>
              ) : null}

              {requests.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {item.first_name} {item.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">ID: {item.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.phone_number}</TableCell>
                  <TableCell>{item.phone_model}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "new" ? "default" : "secondary"}>
                      {item.status === "new" ? "Yeni" : item.status || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                          İncele
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {item.first_name} {item.last_name}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Card className="border-border/70">
                            <CardContent className="space-y-4 p-5">
                              <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Telefon</p>
                                  <p className="font-medium">{item.phone_number}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Smartphone className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Model</p>
                                  <p className="font-medium">{item.phone_model}</p>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Kayit Tarihi</p>
                                <p className="mt-1 font-medium">{formatDateTime(item.created_at)}</p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-border/70">
                            <CardContent className="p-5">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sorun Açıklaması</p>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{item.issue_description}</p>
                            </CardContent>
                          </Card>
                        </div>

                        {item.photo_url ? (
                          <Card className="border-border/70">
                            <CardHeader>
                              <CardTitle className="text-base">Yüklenen Fotoğraf</CardTitle>
                              <CardDescription>{item.photo_name || "Fotoğraf eklendi"}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <img
                                src={item.photo_url}
                                alt={`${item.first_name} ${item.last_name} teknik servis fotoğrafı`}
                                className="max-h-[28rem] w-full rounded-2xl border border-border/70 object-contain"
                              />
                            </CardContent>
                          </Card>
                        ) : null}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
