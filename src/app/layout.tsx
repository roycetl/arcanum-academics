import type { Metadata } from "next";
import CosmicTapestryBackground from "../components/CosmicTapestryBackground";
import { Noto_Sans, Uncial_Antiqua } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const uncialAntiqua = Uncial_Antiqua({
  weight: "400",
  variable: "--font-uncial-antiqua",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STUDIFY",
  description: "Forge your knowledge. Level up your studying.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${uncialAntiqua.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.cdnfonts.com/css/morris-roman" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#0a0e21] text-slate-200" style={{ 
        fontFamily: "'Morris Roman', var(--font-uncial-antiqua), 'Georgia', serif"
      }}>
        <CosmicTapestryBackground />

        {children}
      </body>
    </html>
  );
}
