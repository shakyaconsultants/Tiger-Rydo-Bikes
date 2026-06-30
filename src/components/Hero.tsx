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
        <div className="absolute top-1/4 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#FF5A00] to-transparent" />
        <div className="absolute top-1/2 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#2B2B2B] to-transparent" />
        <div className="absolute top-3/4 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#FF5A00] to-transparent" />
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

        <div className="mt-16 flex flex-1 items-center justify-center lg:mt-0">
          <Image
            src="/images/hero-bike.png"
            alt="Tiger Rydo Scooter"
            width={700}
            height={700}
            className="h-auto w-full max-w-xl object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}


