"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./ui/Button";
import { NAV_LINKS } from "@/lib/constants";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E6E6E6]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" aria-label="Tiger Rydo Home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#2B2B2B] transition-colors hover:text-[#FF5A00]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/dealer/login">
            <Button variant="ghost" size="sm">
              Dealer Login
            </Button>
          </Link>
          <Link href="/#contact">
            <Button size="sm">Book Test Ride</Button>
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-[#111111]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-[#E6E6E6] bg-white px-6 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-[#2B2B2B] hover:text-[#FF5A00]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/dealer/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">
                Dealer Login
              </Button>
            </Link>
            <Link href="/#contact" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Book Test Ride</Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
