"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Mountain, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RotaKulaLogo } from "./icons";
import { getPois } from "@/lib/kula-data";
import type { PointOfInterest } from "@/lib/types";

const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/my-routes", label: "Rotalarım" },
];

export function Header() {
    const pathname = usePathname();
    const [pois, setPois] = React.useState<PointOfInterest[]>([]);

    React.useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois();
            setPois(allPois);
        }
        fetchPois();
    }, []);

    const handleShowPoiOnMap = (poi: PointOfInterest) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`;
        window.open(url, '_blank');
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <RotaKulaLogo className="h-6 w-6 text-primary" />
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
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60 p-0 h-auto">
                                    Gezilecek Yerler
                                    <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {pois.map(poi => (
                                    <DropdownMenuItem key={poi.id} onClick={() => handleShowPoiOnMap(poi)}>
                                        {poi.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
                
                <div className="flex flex-1 items-center justify-between md:justify-end">
                    <Link href="/" className="flex items-center space-x-2 md:hidden">
                        <RotaKulaLogo className="h-6 w-6 text-primary" />
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
                                <div className="px-2.5">
                                    <h3 className="text-muted-foreground">Gezilecek Yerler</h3>
                                    <div className="mt-2 flex flex-col gap-2">
                                        {pois.map(poi => (
                                            <button key={poi.id} onClick={() => handleShowPoiOnMap(poi)} className="text-muted-foreground hover:text-foreground text-left">
                                                {poi.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
