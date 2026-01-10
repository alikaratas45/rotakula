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
    // Always try to show the prompt if it's available.
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // The userChoice property returns a Promise that resolves to an object
      // with an 'outcome' property, either 'accepted' or 'dismissed'.
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        // The prompt will not be shown again until the user dismisses the app.
        // We can clear our saved prompt.
        setDeferredPrompt(null);
      }
    } else {
      // If deferredPrompt is null, the browser hasn't fired the event.
      // This could be because the app is already installed, the browser doesn't support it,
      // or the PWA criteria haven't been met yet.
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
