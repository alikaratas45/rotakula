
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AudioGuideControl } from "./audio-guide-control";
import { useLanguage } from "@/context/language-context";
import { TurkishFlagIcon, UKFlagIcon, FrenchFlagIcon, GermanFlagIcon } from "./icons";


export function Header() {
    const pathname = usePathname();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const { language, setLanguage, translations } = useLanguage();

    const navLinks = [
        { href: "/", label: translations.nav.home },
        { href: "/stories", label: translations.nav.stories },
        { href: "/pois", label: translations.nav.places },
        { href: "/famous", label: translations.nav.about },
        { href: "/food", label: translations.nav.food },
        { href: "/accommodation", label: translations.nav.accommodation },
        { href: "/nearby", label: translations.nav.nearby },
        { href: "/my-routes", label: translations.nav.myRoutes },
    ];

    const handleLinkClick = () => {
        setIsSheetOpen(false);
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
                 <Button variant="outline" size={isMobile ? "icon" : "sm"} className={cn(isMobile && "h-8 w-8")}>
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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                                    "font-bold uppercase transition-colors hover:text-foreground/80",
                                    pathname.startsWith(link.href) && link.href !== "/" || pathname === link.href ? "text-foreground" : "text-foreground/60"
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
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                           <SheetTrigger asChild>
                               <Button variant="ghost">
                                   {translations.header.menu}
                               </Button>
                           </SheetTrigger>
                           <SheetContent side="left">
                                <SheetHeader className="text-left">
                                   <SheetTitle>{translations.header.menu}</SheetTitle>
                                   <SheetDescription>
                                       {translations.header.menuDescription}
                                   </SheetDescription>
                               </SheetHeader>
                               <nav className="grid gap-6 text-lg font-medium mt-8">
                                   {navLinks.map((link, index) => (
                                       <Link
                                           key={link.href}
                                           href={link.href}
                                           onClick={handleLinkClick}
                                           className={cn(
                                               "flex items-center gap-4 px-2.5 font-bold uppercase animate-slide-in-from-left",
                                               pathname.startsWith(link.href) && link.href !== "/" || pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                           )}
                                            style={{ animationDelay: `${150 + index * 50}ms` }}
                                       >
                                           {link.label}
                                       </Link>
                                   ))}
                               </nav>
                           </SheetContent>
                       </Sheet>
                    </div>
                </div>


                {/* Desktop right side */}
                <div className="hidden md:flex flex-1 items-center justify-end gap-2">
                    <AudioGuideControl />
                    <LanguageSelector />
                </div>
            </div>
        </header>
    );
}
