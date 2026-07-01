import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";
import { getSiteSettings } from "@/lib/siteSettings";
import { COLORS } from "@/lib/constants";
import Image from "next/image";

export default async function Hero() {
  const site = await getSiteSettings();

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0A0A0A] pt-24">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[22%] left-0 h-px w-full bg-gradient-to-r from-transparent via-[#FF5A00] to-transparent" />
        <div className="absolute top-[88%] left-0 h-px w-full bg-gradient-to-r from-transparent via-[#FF5A00] to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-16 pb-24 lg:flex-row lg:gap-16 lg:px-8 lg:pt-24">
        <div className="flex-1 text-center lg:text-left">
          {site.logoUrl && (
            <img src={site.logoUrl} alt={site.fullName} className="mb-6 h-14 object-contain lg:mx-0 mx-auto" />
          )}
          <p className="mb-4 text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
            {site.logoTagline}
          </p>
          <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
            {site.heroTitle}
            <br />
            <span className="text-[#FF5A00]">{site.heroHighlight}</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#7A7A7A] lg:text-xl">
            {site.tagline}
            <br />
            <span className="text-white">{site.subTagline}</span>
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <a href="#scooters">
              <Button size="lg" className="group">
                Explore Scooters
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="#contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#111111]">
                Book Test Ride
              </Button>
            </a>
          </div>
        </div>

        <div className="relative mt-16 flex flex-1 items-center justify-end lg:mt-0">

          {/* Background Glow */}
          <div className="absolute h-[520px] w-[520px] rounded-full bg-[#ff8a4c]/20 blur-[140px] animate-glow" />

          {/* Secondary Glow */}
          <div className="absolute h-[350px] w-[350px] rounded-full bg-[#ffd1b3]/10 blur-[90px]" />

          {/* Shadow */}
          <div className="absolute bottom-10 h-10 w-[330px] rounded-full bg-black/60 blur-2xl" />

          <Image
            src="/images/hero-bike.png"
            alt="Tiger Rydo Scooter"
            width={820}
            height={820}
            priority
            sizes="(max-width:768px)100vw,50vw"
            className="
      relative
      z-10
      w-full
      max-w-2xl
      object-contain
      animate-float
      transition-all
      duration-700
      hover:scale-110
      hover:-translate-y-4
      hover:rotate-[-4deg]
      hover:drop-shadow-[0_35px_45px_rgba(255,90,0,0.35)]
    "
          />

        </div>
      </div>
    </section>
  );
}


