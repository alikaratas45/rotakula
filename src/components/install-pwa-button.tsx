
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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
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
      title={translations.nav.installAppTitle}
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
        </div>
      </div>
    </div>
  );
};
