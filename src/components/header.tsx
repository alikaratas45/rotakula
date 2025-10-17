
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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

const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/stories", label: "Hikayeler" },
    { href: "/pois", label: "Gezilecek Yerler" },
    { href: "/food", label: "Lezzet Durakları" },
    { href: "/accommodation", label: "Konaklama" },
    { href: "/my-routes", label: "Rotalarım" },
];

export function Header() {
    const pathname = usePathname();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);

    const handleLinkClick = () => {
        setIsSheetOpen(false);
    };
    
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
                                    "transition-colors hover:text-foreground/80",
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
                    <div className="w-1/3 flex justify-start">
                         <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" className="p-0">
                                    <Menu className="h-10 w-10" />
                                    <span className="sr-only">Menüyü Aç</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                 <SheetHeader className="text-left">
                                    <SheetTitle>Menü</SheetTitle>
                                    <SheetDescription>
                                        Uygulama içinde gezinmek için aşağıdaki bağlantıları kullanabilirsiniz.
                                    </SheetDescription>
                                </SheetHeader>
                                <nav className="grid gap-6 text-lg font-medium mt-8">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={handleLinkClick}
                                            className={cn(
                                                "flex items-center gap-4 px-2.5",
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

                    <div className="w-1/3 flex justify-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image src="/logo.png" alt="RotaKula Logo" width={28} height={28} />
                            <span className="font-bold font-headline text-lg">RotaKula</span>
                        </Link>
                    </div>

                    <div className="w-1/3 flex justify-end">
                        <AudioGuideControl />
                    </div>
                </div>

                {/* Desktop right side */}
                <div className="hidden md:flex flex-1 items-center justify-end gap-2">
                    <AudioGuideControl />
                </div>
            </div>
        </header>
    );
}
