"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export const InstallPwaButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsAppInstalled(true);
    }
  };

  if (isAppInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <div
      className="group animate-fade-in-up cursor-pointer"
      onClick={handleInstallClick}
    >
      <div className={cn(
        "relative p-4 bg-card rounded-2xl border-b-4 border-r-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg",
        "border-pink-500"
      )}>
        <div className="flex flex-col items-center justify-center h-28">
          <Download className="h-12 w-12 text-foreground/80 mb-3 transition-colors group-hover:text-primary" />
          <span className="text-center text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors">
            Uygulamayı Yükle
          </span>
        </div>
      </div>
    </div>
  );
};
