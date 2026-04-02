"use client";

import { Link } from "@/lib/router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export function Footer() {
  const { messages } = useI18n();
  const footer = messages.footer;

  return (
    <footer className="border-t border-primary/60 bg-primary text-primary-foreground">
      <div className="container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="max-w-sm">
            <Link to="/" className="font-display text-lg font-bold">
              {footer.brandName}
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/85">{footer.description}</p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">{footer.sections.categories}</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/products?category=telefon" className="hover:text-primary-foreground">{footer.links.phones}</Link></li>
              <li><Link to="/products?category=ikinci-el-telefon" className="hover:text-primary-foreground">{footer.links.secondHandPhones}</Link></li>
              <li><Link to="/products?category=akilli-saatler" className="hover:text-primary-foreground">{footer.links.smartWatches}</Link></li>
              <li><Link to="/products?category=kilif" className="hover:text-primary-foreground">{footer.links.cases}</Link></li>
              <li><Link to="/products?category=sarj-aleti" className="hover:text-primary-foreground">{footer.links.chargers}</Link></li>
              <li><Link to="/products?category=power-bank" className="hover:text-primary-foreground">{footer.links.powerBanks}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">{footer.sections.services}</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/technical-service" className="hover:text-primary-foreground">{footer.links.technicalService}</Link></li>
              <li><Link to="/auth" className="hover:text-primary-foreground">{footer.links.createAccount}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">{footer.sections.corporate}</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/hakkimizda" className="hover:text-primary-foreground">{footer.links.about}</Link></li>
              <li><Link to="/iletisim" className="hover:text-primary-foreground">{footer.links.contact}</Link></li>
              <li><Link to="/sss" className="hover:text-primary-foreground">{footer.links.faq}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-primary-foreground">{footer.sections.legal}</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
              <li><Link to="/kvkk" className="hover:text-primary-foreground">{footer.links.kvkk}</Link></li>
              <li><Link to="/gizlilik-politikasi" className="hover:text-primary-foreground">{footer.links.privacy}</Link></li>
              <li><Link to="/mesafeli-satis-sozlesmesi" className="hover:text-primary-foreground">{footer.links.distanceSales}</Link></li>
              <li><Link to="/iade-ve-degisim-politikasi" className="hover:text-primary-foreground">{footer.links.returnPolicy}</Link></li>
              <li><Link to="/teslimat-kosullari" className="hover:text-primary-foreground">{footer.links.deliveryTerms}</Link></li>
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
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {footer.contact.viewLocation}
            </a>
          </div>

          <div className="text-center sm:text-right">&copy; {new Date().getFullYear()} {footer.brandName}. {footer.contact.rightsReserved}</div>
        </div>
      </div>
    </footer>
  );
}
