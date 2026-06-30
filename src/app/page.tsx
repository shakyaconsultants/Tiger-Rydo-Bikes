import Hero from "@/components/Hero";
import ValuesSection from "@/components/ValuesSection";
import ScootersSection from "@/components/ScootersSection";
import BatterySection from "@/components/BatterySection";
import SmartConnect from "@/components/SmartConnect";
import CitySection from "@/components/CitySection";
import ContactForm from "@/components/ContactForm";
import NewsletterCTA from "@/components/NewsletterCTA";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Hero />
      <ValuesSection />
      <ScootersSection />
      <BatterySection />
      <SmartConnect />
      <CitySection />
      <ContactForm />
      <NewsletterCTA />
    </>
  );
}
