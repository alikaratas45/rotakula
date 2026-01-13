'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const SplashScreen = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <div className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      <div className="relative perspective-1000">
        <div className="preserve-3d animate-spin-slow">
            <Image
              src="/belediye.png"
              alt="Kula Belediyesi Logosu"
              width={200}
              height={200}
              priority
            />
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-foreground animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        Kula Belediyesi hizmetidir.
      </h2>
    </div>
  );
};

export default SplashScreen;
