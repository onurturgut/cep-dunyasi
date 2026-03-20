"use client";

import { Link } from '@/lib/router';
import { Smartphone, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-primary/60 bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary-foreground/40 bg-transparent">
                <Smartphone className="h-4 w-4 text-primary-foreground" />
              </div>
              TechStore
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/85">
              Premium telefon ve aksesuar magazasi. En yeni teknoloji urunleri, guvenilir alisveris.
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
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> info@techstore.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +90 555 123 45 67
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Muğla/Fethiye, Turkiye
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/25 pt-6 text-center text-sm text-primary-foreground/80">
          &copy; {new Date().getFullYear()} TechStore. Tum haklari saklidir.
        </div>
      </div>
    </footer>
  );
}
