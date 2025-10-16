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

const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/pois", label: "Gezilecek Yerler" },
    { href: "/food", label: "Lezzet Durakları" },
    { href: "/accommodation", label: "Konaklama" },
    { href: "/my-routes", label: "Rotalarım" },
];

export function Header() {
    const pathname = usePathname();
    
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Image src="/logo.png" alt="RotaKula Logo" width={28} height={28} />
                        <span className="hidden font-bold sm:inline-block font-headline text-lg">
                            RotaKula
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {navLinks.map((link) => (
                             <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    pathname === link.href ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                
                <div className="flex flex-1 items-center justify-between md:justify-end">
                    <Link href="/" className="flex items-center space-x-2 md:hidden">
                        <Image src="/logo.png" alt="RotaKula Logo" width={28} height={28} />
                        <span className="font-bold font-headline text-lg">RotaKula</span>
                    </Link>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6" />
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
                                        className={cn(
                                            "flex items-center gap-4 px-2.5",
                                            pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
        </header>
    );
}
