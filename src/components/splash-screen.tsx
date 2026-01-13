'use client';

import Image from 'next/image';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background animate-fade-out pointer-events-none" style={{ animationDelay: '1.8s' }}>
      <div className="relative perspective-1000 animate-fade-in">
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
      <h2 className="mt-8 text-3xl font-semibold text-foreground animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        Yanık Ülke Katakekaumene
      </h2>
    </div>
  );
};

export default SplashScreen;
