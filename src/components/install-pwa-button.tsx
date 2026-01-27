"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/app-context";

export const InstallPwaButton = () => {
  const { toast } = useToast();
  const { translations } = useApp();
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

    // Check if running in standalone mode (PWA)
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isAppInstalled) {
      toast({
        title: translations.nav.installAppAlready,
        description: translations.nav.installAppAlreadyDesc,
      });
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsAppInstalled(true);
      }
    } else {
       toast({
        title: translations.nav.installAppNotPossible,
        description: translations.nav.installAppNotPossibleDesc,
       });
    }
  };

  return (
    <div
      className="group animate-fade-in-up cursor-pointer"
      onClick={handleInstallClick}
      title={isAppInstalled ? translations.nav.installAppAlready : translations.nav.installAppTitle}
    >
      <div className={cn(
        "relative p-4 bg-card rounded-2xl border-b-4 border-r-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg",
        "border-pink-500"
      )}>
        <div className="flex flex-col items-center justify-center h-28">
          <Download className="h-12 w-12 text-foreground/80 mb-3 transition-colors group-hover:text-primary" />
          <span className="text-center text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors">
            {translations.nav.installApp}
          </span>
          <span className="text-center text-xs text-muted-foreground mt-1">(android ve windows için)</span>
        </div>
      </div>
    </div>
  );
};
