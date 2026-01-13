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
      <div className="relative">
        <Image
          src="/belediye.png"
          alt="Kula Belediyesi Logosu"
          width={200}
          height={200}
          priority
        />
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-foreground">
        Kula Belediyesi hizmetidir.
      </h2>
    </div>
  );
}
