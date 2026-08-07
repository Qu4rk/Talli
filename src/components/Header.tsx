"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart2, Settings, ArrowLeft } from "lucide-react";
import { Permanent_Marker } from "next/font/google";
import { useApp } from "@/context/AppContext";

const handwrittenFont = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface HeaderProps {
  showBack?: boolean;
}

export default function Header({ showBack = false }: HeaderProps) {
  const pathname = usePathname();
  const { settings } = useApp();

  const navItems = [
    { name: "Home", path: "/", icon: Home, bg: "bg-[#4ade80]" },
    { name: "Students", path: "/students", icon: Users, bg: "bg-[#1ac2ff]" },
    { name: "Reports", path: "/reports", icon: BarChart2, bg: "bg-[#ff66a3]" },
    { name: "Settings", path: "/settings", icon: Settings, bg: "bg-[#c084fc]" },
  ];

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b-[3px] border-black flex items-center justify-between px-8 md:px-12 shrink-0 z-20 relative shadow-[0_4px_0_0_#000000]">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link href="/" className="p-2 bg-white border-2 border-black shadow-[2px_2px_0_0_#000] text-black hover:translate-x-[1px] hover:translate-y-[1px] transition-all mr-1">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
        )}
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/assets/logo-transparent.png" alt="Talli Logo" width={36} height={36} className="object-contain group-hover:scale-105 transition-transform" />
          <div className={`text-3xl text-black drop-shadow-[2px_2px_0_#ff66a3] rotate-[-2deg] group-hover:rotate-0 transition-transform ${handwrittenFont.className}`}>
            Talli
          </div>
        </Link>
      </div>

      {/* Center Navigation (Neobrutalist Bar) */}
      <nav className="flex items-center gap-2 bg-white border-[3px] border-black p-1 shadow-[4px_4px_0_0_#000000]">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-black transition-all ${
                isActive
                  ? `${item.bg} text-black border-2 border-black shadow-[2px_2px_0_0_#000]`
                  : `text-black hover:bg-slate-100`
              }`}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right User Avatar */}
      <div className="flex items-center gap-3">
        <Link href="/settings" className="flex items-center gap-3 group">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-black tracking-tight">{settings.teacherName}</div>
            <div className="text-[10px] font-bold text-purple-700">{settings.schoolName}</div>
          </div>
          <div className="w-10 h-10 rounded-none bg-[#facc15] border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center text-sm font-black text-black group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
            JD
          </div>
        </Link>
      </div>
    </header>
  );
}
