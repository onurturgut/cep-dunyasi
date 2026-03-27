import { Clock3, Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/lib/router";
import type { CorporateContactBlock } from "@/types/corporate-page";

const iconMap: Record<string, LucideIcon> = {
  phone: Phone,
  mail: Mail,
  "map-pin": MapPin,
  clock: Clock3,
  globe: Globe,
  whatsapp: MessageCircle,
};

type ContactInfoCardProps = {
  block: CorporateContactBlock;
};

export function ContactInfoCard({ block }: ContactInfoCardProps) {
  const Icon = block.icon ? iconMap[block.icon] : null;
  const content = (
    <div className="rounded-3xl border border-border/70 bg-card/75 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {Icon ? <Icon className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{block.label}</p>
          <p className="mt-2 text-base font-medium text-foreground">{block.value}</p>
          {block.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.description}</p> : null}
        </div>
      </div>
    </div>
  );

  if (!block.href) {
    return content;
  }

  const isExternal = /^https?:\/\//i.test(block.href);

  if (isExternal) {
    return (
      <a href={block.href} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }

  return (
    <Link to={block.href} className="block">
      {content}
    </Link>
  );
}

