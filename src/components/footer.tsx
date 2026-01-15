"use client";

import Image from "next/image";
import { useLanguage } from "@/context/app-context";

export function Footer() {
    const { translations } = useLanguage();
    const currentYear = new Date().getFullYear();
    return (
        <footer className="border-t bg-background">
            <div className="flex flex-col items-center justify-center gap-4 py-6 px-4">
                <div className="flex items-center justify-center gap-2">
                    <Image src="/logo.png?v=3" alt="RotaKula Logo" width={24} height={24} className="h-6 w-6" />
                    <p className="text-sm leading-loose text-center">
                       © {currentYear} {translations.footer.copyright_part2}
                    </p>
                </div>
                <div className="w-full max-w-4xl mx-auto">
                    <p className="text-center text-xs text-muted-foreground/80">
                        {translations.footer.credits}
                    </p>
                </div>
            </div>
        </footer>
    );
}
