"use client";

import { Link } from '@/lib/router';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-primary/60 bg-primary text-primary-foreground">
      <div className="container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-3 font-display text-lg font-bold">
              <img
                src="/images/_preview-white-v4.png"
                alt="Cep Dunyasi"
                className="h-10 w-auto rounded-lg bg-primary-foreground/5 p-1"
              />
              Cep Dunyasi
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/85">
              Premium telefonlar, aksesuarlar ve teknik servis cozumleriyle her ekranda hizli ve guvenilir alisveris deneyimi.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Kategoriler</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li>
                <Link to="/products?category=telefon" className="hover:text-primary-foreground">
                  Telefonlar
                </Link>
              </li>
              <li>
                <Link to="/products?category=ikinci-el-telefon" className="hover:text-primary-foreground">
                  2. El Telefonlar
                </Link>
              </li>
              <li>
                <Link to="/products?category=akilli-saatler" className="hover:text-primary-foreground">
                  Akilli Saatler
                </Link>
              </li>
              <li>
                <Link to="/products?category=kilif" className="hover:text-primary-foreground">
                  Kiliflar
                </Link>
              </li>
              <li>
                <Link to="/products?category=sarj-aleti" className="hover:text-primary-foreground">
                  Sarj Aletleri
                </Link>
              </li>
              <li>
                <Link to="/products?category=power-bank" className="hover:text-primary-foreground">
                  Power Bank
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Hizmetler</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li>
                <Link to="/products?category=teknik-servis" className="hover:text-primary-foreground">
                  Teknik Servis
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-primary-foreground">
                  Hesap Olustur
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Iletisim</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" /> info@cepdunyasi.com
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" /> +90 555 123 45 67
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Mugla / Fethiye, Turkiye
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/25 pt-6 text-center text-sm text-primary-foreground/80">
          &copy; {new Date().getFullYear()} Cep Dunyasi. Tum haklari saklidir.
        </div>
      </div>
    </footer>
  );
}
