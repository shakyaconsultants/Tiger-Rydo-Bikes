import Link from "next/link";
import Logo from "./Logo";
import { BRAND, NAV_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo variant="reverse" showTagline />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[#7A7A7A]">
              {BRAND.promise}
            </p>
            <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-[#FF5A00]">
              {BRAND.motto}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider">EXPLORE</h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#7A7A7A] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/dealer/login"
                  className="text-sm text-[#7A7A7A] transition-colors hover:text-white"
                >
                  Dealer Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider">CONTACT</h4>
            <ul className="space-y-3 text-sm text-[#7A7A7A]">
              <li>info@tigerebikes.com</li>
              <li>+91 9125158769</li>
              <li>Mon–Sat, 9AM–6PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#2B2B2B] pt-8 md:flex-row">
          <p className="text-xs text-[#7A7A7A]">
            © {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-[#7A7A7A]">
            <Link href="#" className="hover:text-white">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
