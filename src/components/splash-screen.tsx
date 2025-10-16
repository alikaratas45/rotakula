import Image from "next/image";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="animate-spin-slow">
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
