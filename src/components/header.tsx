
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, Check, AudioWaveform, QrCode } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AudioGuideControl } from "./audio-guide-control";
import { useLanguage } from "@/context/language-context";
import { TurkishFlagIcon, UKFlagIcon, FrenchFlagIcon, GermanFlagIcon } from "./icons";


function ThemeSwitcher({ isMobile = false }: { isMobile?: boolean }) {
    const { setTheme, theme } = useTheme();
    
    return (
         <Button
            variant="outline"
            size={isMobile ? "icon" : "icon"}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={cn("h-8 w-8", !isMobile && "h-9 w-9")}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

export function Header() {
    const pathname = usePathname();
    const { language, setLanguage, translations } = useLanguage();

    const navLinks = [
        { href: "/", label: translations.nav.thematicRoutes },
        { href: "/food", label: translations.nav.food },
        { href: "/pois", label: translations.nav.places },
        { href: "/nearby", label: translations.nav.nearby },
        { href: "/accommodation", label: translations.nav.accommodation },
        { href: "/stories", label: translations.nav.stories },
        { href: "/my-routes", label: translations.nav.myRoutes },
        { href: "/famous", label: translations.nav.about },
    ];
    
    const languageOptions = {
        tr: { name: 'Türkçe', Icon: TurkishFlagIcon },
        en: { name: 'English', Icon: UKFlagIcon },
        fr: { name: 'Français', Icon: FrenchFlagIcon },
        de: { name: 'Deutsch', Icon: GermanFlagIcon },
    };
    
    const CurrentFlag = languageOptions[language].Icon;

    const LanguageSelector = ({ isMobile = false }: { isMobile?: boolean }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="outline" size={isMobile ? "sm" : "sm"} className={cn("h-8", !isMobile && "h-9")}>
                    <CurrentFlag className={cn("rounded-sm", isMobile ? "h-5 w-5" : "h-4 w-4")} />
                    {!isMobile && <span className="ml-2">{language.toUpperCase()}</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMobile ? "end" : "end"}>
                {Object.entries(languageOptions)
                    .filter(([langCode]) => langCode !== language)
                    .map(([langCode, { name, Icon }]) => (
                    <DropdownMenuItem key={langCode} onClick={() => setLanguage(langCode as 'tr' | 'en' | 'fr' | 'de')}>
                        <Icon className="mr-2 h-4 w-4 rounded-sm" />
                        <span>{name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                {/* Desktop Header */}
                <div className="hidden md:flex mr-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/logo.png" alt="RotaKula Logo" width={28} height={28} />
                        <span className="hidden font-bold sm:inline-block font-headline text-lg">
                            RotaKula
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium ml-6">
                        {navLinks.map((link) => (
                             <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "font-bold uppercase tracking-wider transition-colors hover:text-primary",
                                    pathname === link.href ? "text-primary" : "text-foreground/60"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                
                {/* Mobile Header */}
                <div className="flex flex-1 items-center justify-between md:hidden">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/logo.png" alt="RotaKula Logo" width={28} height={28} />
                        <span className="font-bold font-headline text-lg">RotaKula</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <AudioGuideControl />
                        <LanguageSelector isMobile={true} />
                        <ThemeSwitcher isMobile={true} />
                    </div>
                </div>


                {/* Desktop right side */}
                <div className="hidden md:flex flex-1 items-center justify-end gap-2">
                    <AudioGuideControl />
                    <LanguageSelector />
                    <ThemeSwitcher />
                </div>
            </div>
        </header>
    );
}
