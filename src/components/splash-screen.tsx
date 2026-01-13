
"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function SplashScreen({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-1000",
        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative animate-spin-slow">
        <Image
          src="/belediye.png"
          alt="Kula Belediyesi Logosu"
          width={500}
          height={500}
          priority
        />
      </div>
      <h2 className="mt-8 text-3xl font-semibold text-foreground">
        Kula Belediyesi hizmetidir.
      </h2>
    </div>
  );
}
