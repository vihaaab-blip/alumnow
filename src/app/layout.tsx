import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { SessionProvider } from "./SessionProvider";
import { RouteNav } from "@/components/RouteNav";
import { RouteFooter } from "@/components/RouteFooter";
import { Toaster } from "@/components/ui/Toaster";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "alumnow. — Alumni-Student Connect Platform",
  description:
    "From where you are. To where you want to be. Book video-call sessions with verified alumni for personalised guidance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans`}
      >
        <SessionProvider>
          <QueryProvider>
            <div className="flex min-h-[100dvh] flex-col">
              <RouteNav />
              <main className="flex-1">{children}</main>
              <RouteFooter />
            </div>
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
