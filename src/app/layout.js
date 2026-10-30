import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sheggar Wheels | Peer-to-peer car rentals",
  description: "Explore demo car rentals from local owners in Addis Ababa. Sheggar Wheels is a frontend capstone simulation.",
  applicationName: "Sheggar Wheels",
  openGraph: { title: "Sheggar Wheels", description: "A peer-to-peer car rental frontend demo for Addis Ababa.", type: "website" },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
