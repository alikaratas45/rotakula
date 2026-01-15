"use client";

import Image from "next/image";
import { useLanguage } from "@/context/app-context";

export function Footer() {
    const { translations } = useLanguage();
    const currentYear = new Date().getFullYear();
    return (
        <footer className="border-t bg-background">
            <div className="container flex flex-col justify-center gap-4 py-6">
                <div className="flex items-center justify-center gap-2">
                    <Image src="/logo.png?v=3" alt="RotaKula Logo" width={24} height={24} className="h-6 w-6" />
                    <p className="text-sm leading-loose text-muted-foreground text-center">
                       © {currentYear} Tüm hakları Kula Belediyesi'ne aittir.
                    </p>
                </div>
                 <p className="text-center text-xs text-muted-foreground/80 max-w-2xl mx-auto">
                    {translations.footer.credits}
                </p>
            </div>
        </footer>
    );
}
