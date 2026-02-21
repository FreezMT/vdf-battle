"use client";

import Link from "next/link";

export default function DynamicIslandHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <div className="bg-black rounded-full px-6 py-2.5 shadow-lg">
        <Link href="/" className="text-white font-medium text-sm tracking-wide">
          Vinyl Dance Battle
        </Link>
      </div>
    </header>
  );
}
