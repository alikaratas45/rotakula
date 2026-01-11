
"use client"

import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, Home, UserCog, ClipboardList, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AudioGuideControl } from "./audio-guide-control";
import { useApp } from "@/context/app-context";
import { TurkishFlagIcon, UKFlagIcon, FrenchFlagIcon, GermanFlagIcon } from "./icons";


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
    const { language, setLanguage, translations, isAdmin, handleAdminLogin } = useApp();
    const [clickCount, setClickCount] = React.useState(0);
    const [showAdminDialog, setShowAdminDialog] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");


    const handleLogoClick = () => {
        const newClickCount = clickCount + 1;
        setClickCount(newClickCount);
        if (newClickCount >= 5) {
            setShowAdminDialog(true);
            setClickCount(0); // Reset count
        }
    };
    
    const onPasswordSubmit = () => {
        handleAdminLogin(email, password);
        setShowAdminDialog(false);
        setEmail("");
        setPassword("");
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
                {Object.entries(languageOptions).map(([langCode, { name, Icon }]) => (
                    <DropdownMenuItem key={langCode} onClick={() => setLanguage(langCode as 'tr' | 'en' | 'fr' | 'de')}>
                        <Icon className="mr-2 h-4 w-4 rounded-sm" />
                        <span>{name}</span>
                        {language === langCode && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const AdminButton = () => {
        if (!isAdmin) return null;

        return (
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                        <UserCog className="mr-2 h-4 w-4" />
                        Admin Paneli
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Yönetim</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/admin/surveys">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Anket Sonuçları</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
           </DropdownMenu>
        )
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                {/* Desktop Header */}
                <div className="hidden md:flex flex-1 items-center">
                    <div onClick={handleLogoClick} className="cursor-pointer">
                        <Link href="/" className="flex items-center space-x-2 focus:outline-none">
                            <Image src="/logo.png?v=2" alt="RotaKula Logo" width={28} height={28} />
                            <span className="hidden font-bold sm:inline-block font-headline text-lg">
                                RotaKula
                            </span>
                        </Link>
                    </div>
                </div>
                
                {/* Mobile Header */}
                <div className="flex flex-1 items-center justify-between md:hidden">
                    <div onClick={handleLogoClick} className="cursor-pointer">
                        <Link href="/" className="flex items-center space-x-2 focus:outline-none">
                            <Image src="/logo.png?v=2" alt="RotaKula Logo" width={28} height={28} />
                            <span className="font-bold font-headline text-lg">RotaKula</span>
                        </Link>
                    </div>
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
                    <AdminButton />
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
             <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Admin Girişi</DialogTitle>
                    <DialogDescription>
                        Admin paneline erişmek için lütfen e-posta ve şifrenizi girin.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                E-posta
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="admin@example.com"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Şifre
                            </Label>
                             <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                    <Button onClick={onPasswordSubmit}>Giriş Yap</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    );
}
