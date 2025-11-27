import localFont from "next/font/local";

import "./app.css";
import Header from "@/components/Header";
import ViewCanvas from "@/components/ViewCanvas";
import Footer from "@/components/Footer";
import { CartProvider } from "./providers/CartProvider";
import { SmoothScrollProvider } from "./providers/SmoothScrollProvider";

const alpino = localFont({
  src: "../../public/fonts/Alpino-Variable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-alpino",
});

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={alpino.variable}>
    <body className="overflow-x-hidden bg-slate-900 text-white">
      <SmoothScrollProvider>
        <CartProvider>
          <Header />
          <main>
            {children}
            <ViewCanvas />
          </main>
          <Footer />
        </CartProvider>
      </SmoothScrollProvider>
    </body>
    </html>
  );
}