
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
import { AudioGuideControl } from "./audio-guide-control";
import { useLanguage } from "@/context/language-context";
import { Globe } from "lucide-react";
import { TurkishFlagIcon, UKFlagIcon } from "./icons";


export function Header() {
    const pathname = usePathname();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const { language, setLanguage, translations } = useLanguage();

    const navLinks = [
        { href: "/", label: translations.nav.home },
        { href: "/stories", label: translations.nav.stories },
        { href: "/pois", label: translations.nav.places },
        { href: "/food", label: translations.nav.food },
        { href: "/accommodation", label: translations.nav.accommodation },
        { href: "/nearby", label: translations.nav.nearby },
        { href: "/my-routes", label: translations.nav.myRoutes },
    ];

    const handleLinkClick = () => {
        setIsSheetOpen(false);
    };

    const toggleLanguage = () => {
        setLanguage(language === 'tr' ? 'en' : 'tr');
    }
    
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
                        <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Change language">
                             {language === 'tr' ? <UKFlagIcon className="h-5 w-5 rounded-sm" /> : <TurkishFlagIcon className="h-5 w-5 rounded-sm" />}
                        </Button>
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
                                   {navLinks.map((link) => (
                                       <Link
                                           key={link.href}
                                           href={link.href}
                                           onClick={handleLinkClick}
                                           className={cn(
                                               "flex items-center gap-4 px-2.5 font-bold uppercase",
                                               pathname.startsWith(link.href) && link.href !== "/" || pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                           )}
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
                    <Button variant="outline" size="sm" onClick={toggleLanguage}>
                        {language === 'tr' ? (
                            <>
                                <UKFlagIcon className="mr-2 h-4 w-4 rounded-sm" />
                                <span>English</span>
                            </>
                        ) : (
                            <>
                                <TurkishFlagIcon className="mr-2 h-4 w-4 rounded-sm" />
                                <span>Türkçe</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </header>
    );
}
