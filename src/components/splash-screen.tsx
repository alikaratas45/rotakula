import Image from "next/image";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background perspective-1000">
      <div className="animate-spin-slow preserve-3d">
        <Image
          src="/belediye.png"
          alt="Kula Belediyesi Logosu"
          width={250}
          height={250}
          priority
        />
      </div>
    </div>
  );
}
