
"use client"

import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, Home, UserCog } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AudioGuideControl } from "./audio-guide-control";
import { useApp } from "@/context/app-context";
import { TurkishFlagIcon, UKFlagIcon, FrenchFlagIcon, GermanFlagIcon } from "./icons";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

function ThemeSwitcher({ isMobile = false }: { isMobile?: boolean }) {
    const { setTheme, theme } = useTheme();
    const { translations } = useApp();
    
    return (
         <Button
            variant="outline"
            size={isMobile ? "icon" : "icon"}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={cn("h-8 w-8", !isMobile && "h-9 w-9")}
            aria-label={translations.header.toggleTheme}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{translations.header.toggleTheme}</span>
        </Button>
    )
}

export function Header() {
    const { language, setLanguage, translations } = useApp();
    const [logoClickCount, setLogoClickCount] = React.useState(0);
    const [showAdminButton, setShowAdminButton] = React.useState(false);
    const { user } = useUser();
    const { toast } = useToast();

    const handleLogoClick = () => {
        const newCount = logoClickCount + 1;
        setLogoClickCount(newCount);
        if (newCount >= 5) {
            setShowAdminButton(true);
        }
    };

    const handleAdminButtonClick = () => {
        if (user) {
            toast({
                title: "Admin UID",
                description: `Mevcut Admin UID: ${user.uid}`,
                duration: 15000, 
            });
        } else {
            toast({
                title: "Giriş Yapılmamış",
                description: "UID'nizi görmek için lütfen önce giriş yapın.",
                variant: "destructive",
            });
        }
    };

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
                <div className="hidden md:flex flex-1 items-center">
                    <button onClick={handleLogoClick} className="flex items-center space-x-2 focus:outline-none">
                        <Image src="/logo.png?v=2" alt="RotaKula Logo" width={28} height={28} />
                        <span className="hidden font-bold sm:inline-block font-headline text-lg">
                            RotaKula
                        </span>
                    </button>
                </div>
                
                {/* Mobile Header */}
                <div className="flex flex-1 items-center justify-between md:hidden">
                    <button onClick={handleLogoClick} className="flex items-center space-x-2 focus:outline-none">
                        <Image src="/logo.png?v=2" alt="RotaKula Logo" width={28} height={28} />
                        <span className="font-bold font-headline text-lg">RotaKula</span>
                    </button>
                    <div className="flex items-center gap-1">
                        <Button asChild variant="outline" size="icon" className="h-8 w-8">
                            <Link href="/">
                                <Home className="h-4 w-4" />
                            </Link>
                        </Button>
                        <AudioGuideControl />
                        <LanguageSelector isMobile={true} />
                        <ThemeSwitcher isMobile={true} />
                    </div>
                </div>


                {/* Desktop right side */}
                <div className="hidden md:flex items-center justify-end gap-2">
                     {showAdminButton && (
                        <Button onClick={handleAdminButtonClick} variant="destructive" size="sm" className="h-9">
                            <UserCog className="mr-2 h-4 w-4" />
                            Admin Paneli
                        </Button>
                    )}
                    <Button asChild variant="outline" size="sm" className="h-9">
                         <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            {translations.nav.home}
                        </Link>
                    </Button>
                    <AudioGuideControl />
                    <LanguageSelector />
                    <ThemeSwitcher />
                </div>
            </div>
        </header>
    );
}
