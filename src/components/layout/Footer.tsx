"use client";

import { Link } from "@/lib/router";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-primary/60 bg-primary text-primary-foreground">
      <div className="container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-3 font-display text-lg font-bold">
              <img src="/images/_preview-white-v4.png" alt="Cep Dünyası" className="h-10 w-auto rounded-lg bg-primary-foreground/5 p-1" />
              Cep Dünyası
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/85">
              Premium telefonlar, aksesuarlar ve teknik servis çözümleriyle her ekranda hızlı ve güvenilir alışveriş deneyimi.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Kategoriler</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/products?category=telefon" className="hover:text-primary-foreground">Telefonlar</Link></li>
              <li><Link to="/products?category=ikinci-el-telefon" className="hover:text-primary-foreground">2. El Telefonlar</Link></li>
              <li><Link to="/products?category=akilli-saatler" className="hover:text-primary-foreground">Akıllı Saatler</Link></li>
              <li><Link to="/products?category=kilif" className="hover:text-primary-foreground">Kılıflar</Link></li>
              <li><Link to="/products?category=sarj-aleti" className="hover:text-primary-foreground">Şarj Aletleri</Link></li>
              <li><Link to="/products?category=power-bank" className="hover:text-primary-foreground">Power Bank</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Hizmetler</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/technical-service" className="hover:text-primary-foreground">Teknik Servis</Link></li>
              <li><Link to="/auth" className="hover:text-primary-foreground">Hesap Oluştur</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Kurumsal</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/hakkimizda" className="hover:text-primary-foreground">Hakkımızda</Link></li>
              <li><Link to="/iletisim" className="hover:text-primary-foreground">İletişim</Link></li>
              <li><Link to="/sss" className="hover:text-primary-foreground">Sık Sorulan Sorular</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Yasal</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/kvkk" className="hover:text-primary-foreground">KVKK</Link></li>
              <li><Link to="/gizlilik-politikasi" className="hover:text-primary-foreground">Gizlilik Politikası</Link></li>
              <li><Link to="/mesafeli-satis-sozlesmesi" className="hover:text-primary-foreground">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link to="/iade-ve-degisim-politikasi" className="hover:text-primary-foreground">İade ve Değişim Politikası</Link></li>
              <li><Link to="/teslimat-kosullari" className="hover:text-primary-foreground">Teslimat Koşulları</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-primary-foreground/25 pt-6 text-sm text-primary-foreground/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" /> info@cepdunyasi.com
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" /> +90 555 123 45 67
            </div>
            <a
              href="https://www.google.com/maps/place//data=!4m2!3m1!1s0x14c043f9b37ca433:0xb93f40e56555e9a1?sa=X&ved=1t:8290&ictx=111"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 transition-colors hover:text-primary-foreground"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Konumu Gör
            </a>
          </div>

          <div className="text-center sm:text-right">&copy; {new Date().getFullYear()} Cep Dünyası. Tüm hakları saklıdır.</div>
        </div>
      </div>
    </footer>
  );
}
