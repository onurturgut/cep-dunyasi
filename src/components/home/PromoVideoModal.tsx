"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PromoVideoModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Sadece ilk girişte göstermek için localStorage kontrolü
    const hasSeenPromo = localStorage.getItem("cep_dunyasi_promo_seen");
    
    if (!hasSeenPromo) {
      // Sayfa yüklendikten 1 saniye sonra açılsın
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("cep_dunyasi_promo_seen", "true");
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-none" aria-describedby="promo-video">
        <DialogTitle className="sr-only">Cep Dünyası Tanıtım Filmi</DialogTitle>
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <video
            className="w-full h-full object-contain"
            autoPlay
            controls
            playsInline
            preload="metadata"
          >
            {/* Tanıtım videosu varsayılan olarak mevcut bir video dosyasına ayarlandı */}
            <source src="/images/AF%C4%B0%C5%9E1.mp4" type="video/mp4" />
            Tarayıcınız video oynatıcıyı desteklemiyor.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
