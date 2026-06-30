import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";

interface ScooterSpec {
  readonly label: string;
  readonly value: string;
}

export interface ScooterData {
  _id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  range: number;
  topSpeed: number;
  chargeTime: string;
  featured: boolean;
  specs: readonly ScooterSpec[];
}

interface ScooterCardProps {
  scooter: ScooterData;
}

export default function ScooterCard({ scooter }: ScooterCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(scooter.price);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E6E6E6] bg-white transition-all duration-300 hover:border-[#FF5A00]/30 hover:shadow-xl">
      {scooter.featured && (
        <span className="absolute top-4 right-4 z-10 rounded-full bg-[#FF5A00] px-3 py-1 text-xs font-bold text-white">
          FEATURED
        </span>
      )}

      <div className="relative flex h-56 items-center justify-center bg-[#0A0A0A]">
        <MiniScooterSvg />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF5A00] to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium tracking-wider text-[#FF5A00]">
          {scooter.tagline.toUpperCase()}
        </p>
        <h3 className="mt-2 font-display text-2xl font-black text-[#111111]">
          {scooter.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[#7A7A7A]">
          {scooter.description}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {scooter.specs.slice(0, 4).map((spec) => (
            <div key={spec.label} className="rounded-lg bg-[#F5F5F5] px-3 py-2">
              <p className="text-[10px] tracking-wider text-[#7A7A7A]">{spec.label}</p>
              <p className="text-sm font-bold text-[#111111]">{spec.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[#E6E6E6] pt-6">
          <div>
            <p className="text-xs text-[#7A7A7A]">Starting at</p>
            <p className="font-display text-xl font-black text-[#111111]">
              {formattedPrice}
            </p>
          </div>
          <a href="#contact">
            <Button size="sm" className="group/btn">
              Enquire
              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </a>
        </div>
      </div>
    </article>
  );
}

function MiniScooterSvg() {
  return (
    <svg viewBox="0 0 200 120" className="h-32 w-48" aria-hidden="true">
      <rect x="60" y="40" width="80" height="40" rx="6" fill="#2B2B2B" />
      <line x1="100" y1="40" x2="100" y2="15" stroke="#7A7A7A" strokeWidth="3" />
      <circle cx="70" cy="85" r="18" stroke="#FF5A00" strokeWidth="2" fill="#111111" />
      <circle cx="130" cy="85" r="18" stroke="#FF5A00" strokeWidth="2" fill="#111111" />
      <circle cx="155" cy="50" r="5" fill="#FF5A00" />
    </svg>
  );
}
