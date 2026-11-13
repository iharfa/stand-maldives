import { Instrument_Sans, Newsreader, Poppins } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = Newsreader({ subsets: ["latin", "latin-ext"], weight: ["300", "400"], variable: "--font-serif", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-poppins", display: "swap" });

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://standmaldives.com"),
  title: { default: "Stand Maldives — Service Charge Database", template: "%s · Stand Maldives" },
  description: "Service charge paid by Maldives resorts, reported by workers and reviewed before publishing.",
  icons: { icon: [{ url: "/favicon-32.png", sizes: "32x32" }, { url: "/favicon-16.png", sizes: "16x16" }], apple: "/apple-touch-icon.png" },
  openGraph: { images: ["/og-image.png"] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
