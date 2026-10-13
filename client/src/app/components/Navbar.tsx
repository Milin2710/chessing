"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
// import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  ChevronDown,
  Crown,
  Play,
  BookOpen,
  Eye,
  Users,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Palette,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "./ThemeProvider";
import { useUserData } from "../contexts/UserDataContext";

export default function Navbar() {
  const { theme, changetheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userData } = useUserData();

  if (!userData) return <p>Loading...</p>;

  const isLoggedIn = userData;
  const userRating = userData.rating;
  const username = userData.username;

  const navigationItems = [
    { name: "Play", href: "/play", icon: Play },
    { name: "Learn", href: "/learn", icon: BookOpen },
    { name: "News", href: "/news", icon: Users },
    { name: "Social", href: "/social", icon: Users },
  ];

  const themeColors = {
    pink: "#c10007",
    blue: "#166be5",
    yellow: "#9f2d00",
    green: "green",
    gray: "#262626",
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Zugzwang</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            <div
              onClick={changetheme}
              className="cursor-pointer flex items-center space-x-1 px-3 py-2 gap-2 font-medium"
            >
              <Palette
                className="w-5 h-5"
                fill={`${themeColors[theme]}`}
                color="white"
              />{" "}
              <span className={`text-[${themeColors[theme]}]`}>Theme</span>
            </div>
          </div>

          {/* Right side - Auth & User Menu */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                {/* User Rating */}
                <Badge variant="secondary" className="hidden sm:flex">
                  <Trophy className="w-3 h-3 mr-1" />
                  {userRating}
                </Badge>
                <Button
                  variant="ghost"
                  className="flex items-center p-2"
                >
                  {/* User Menu */}
                  <UserButton />
                  <span className="hidden sm:block font-medium cursor-default">
                    {username}
                  </span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
                <Button size="sm">Sign Up</Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              {isLoggedIn && (
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <Badge variant="secondary">
                      <Trophy className="w-3 h-3 mr-1" />
                      {userRating}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
