
"use client";

import Image from "next/image";
import { useLanguage } from "@/context/app-context";

export function Footer() {
    const { translations } = useLanguage();
    const currentYear = new Date().getFullYear();
    return (
        <footer className="border-t bg-background">
            <div className="container flex flex-col items-center justify-center gap-4 h-24 md:h-28 md:flex-row">
                <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
                    <Image src="/logo.png?v=2" alt="RotaKula Logo" width={24} height={24} className="h-6 w-6" />
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © {currentYear} RotaKula. {translations.footer.copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}
