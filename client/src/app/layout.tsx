import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import SyncUser from "./components/SyncUser";
import { useContext, useEffect, useState } from "react";
import { createContext } from "vm";
import ThemeProvider from "./components/ThemeProvider";
import { UserDataProvider } from "./contexts/UserDataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chessing",
  description: "Play chess online with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserDataProvider>
      <ClerkProvider>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider>
              <Navbar />
              <SyncUser />
              {children}
            </ThemeProvider>
          </body>
        </html>
      </ClerkProvider>
    </UserDataProvider>
  );
}
