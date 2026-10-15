import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Workroom — job management",
  description: "Assign, track and review work across your company.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} min-h-screen bg-[#EEF1F4] text-[#14202E] antialiased`}>
        {children}
      </body>
    </html>
  );
}
