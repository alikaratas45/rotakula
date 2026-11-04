
"use client";

import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/app-context";

export function Footer() {
    const { translations, isAdmin } = useApp();
    const currentYear = new Date().getFullYear();
    return (
        <footer className="border-t bg-background">
            <div className="flex flex-col items-center justify-center gap-4 py-6 px-4">
                <div className="flex items-center justify-center gap-2">
                    <Image src="https://i.imgur.com/PS0UgvO.png" alt="RotaKula Logo" width={24} height={24} className="h-6 w-6" />
                    <p className="text-sm leading-loose text-center">
                       © {currentYear} {translations.footer.copyright_part2}
                    </p>
                </div>
                <div className="w-full max-w-4xl mx-auto">
                    <p className="text-center text-xs text-muted-foreground/80">
                        {translations.footer.credits}
                    </p>
                </div>
                {isAdmin && (
                    <Link
                        href="/admin/pois"
                        className="text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                    >
                        Admin Paneli
                    </Link>
                )}
            </div>
        </footer>
    );
}
