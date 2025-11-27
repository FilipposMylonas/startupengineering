import React from "react";
import { FPLogo } from "./FPLogo";
import { Instagram, Twitter, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

type Props = {};

export default function Footer({}: Props) {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <FPLogo className="h-16" />
            <p className="text-sm text-gray-400">
              Premium flight simulation hardware. Precision-engineered for enthusiasts and professionals.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-sky-400"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-sky-400"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-sky-400"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Products</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#shop-carousel" className="text-gray-400 transition-colors hover:text-white">
                  Raptor Grip — €250
                </Link>
              </li>
              <li>
                <Link href="#shop-carousel" className="text-gray-400 transition-colors hover:text-white">
                  Raptor Throttle — €300
                </Link>
              </li>
              <li>
                <Link href="#shop-carousel" className="text-gray-400 transition-colors hover:text-white">
                  Raptor Base — €150
                </Link>
              </li>
              <li>
                <Link href="#shop-carousel" className="text-gray-400 transition-colors hover:text-white">
                  Universal Mount System — €100
                </Link>
              </li>
              <li>
                <Link href="#shop-carousel" className="text-gray-400 transition-colors hover:text-white">
                  Complete System — €800
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                  Replacement Parts
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                  Technology
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                  Community
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                  Press & Media
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location Column */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Get in Touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-400" />
                <div className="text-gray-400">
                  <p>Maastricht University</p>
                  <p>Minderbroedersberg 4-6</p>
                  <p>6211 LK Maastricht</p>
                  <p>Netherlands</p>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-sky-400" />
                <a href="mailto:hello@raptorgear.eu" className="text-gray-400 transition-colors hover:text-white">
                  hello@raptorgear.eu
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Raptor Gear
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                Terms
              </Link>
              <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                Shipping
              </Link>
              <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                Returns
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>A Startup Engineering project · Maastricht University</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
