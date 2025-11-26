
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, Home, LogIn, LogOut, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useFirebase, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { AudioGuideControl } from "./audio-guide-control";
import { useApp } from "@/context/app-context";
import { TurkishFlagIcon, UKFlagIcon, FrenchFlagIcon, GermanFlagIcon } from "./icons";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_UID } from '@/firebase/config';


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

function AdminAuth({ isMobile = false }: { isMobile?: boolean }) {
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const isAdmin = user && user.uid === ADMIN_UID;

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      toast({
        title: `Giriş Başarılı, ${result.user.displayName}`,
        description: `Admin UID'niz: ${result.user.uid}`,
        duration: 10000, // Show for longer
      });
    } catch (error) {
      console.error("Admin sign-in error:", error);
      toast({
        title: "Giriş Başarısız",
        description: "Google ile giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Çıkış Yapıldı",
        description: "Yönetici oturumu sonlandırıldı.",
      });
    } catch (error) {
      console.error("Admin sign-out error:", error);
    }
  };

  if (isUserLoading) {
    return <Button variant="outline" size="sm" className={cn("h-9", isMobile && "w-full justify-start")} disabled>...</Button>;
  }

  if (isAdmin) {
    return (
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/admin/surveys">
                <FileText className="mr-2 h-4 w-4" />
                Anketler
            </Link>
        </Button>
        <Button variant="outline" size="sm" className={cn("h-9", isMobile && "w-full justify-start")} onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" className={cn("h-9", isMobile && "w-full justify-start")} onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" />
      Admin Girişi
    </Button>
  );
}

export function Header() {
    const { language, setLanguage, translations } = useApp();
    const [adminClickCount, setAdminClickCount] = React.useState(0);
    const [showAdmin, setShowAdmin] = React.useState(false);
    const adminClickTimer = React.useRef<NodeJS.Timeout | null>(null);

    const handleLogoClick = () => {
        if (adminClickTimer.current) {
            clearTimeout(adminClickTimer.current);
        }

        const newClickCount = adminClickCount + 1;
        setAdminClickCount(newClickCount);

        if (newClickCount >= 5) {
            setShowAdmin(prev => !prev);
            setAdminClickCount(0);
        }

        adminClickTimer.current = setTimeout(() => {
            setAdminClickCount(0);
        }, 1500);
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
                    <div onClick={handleLogoClick} className="cursor-pointer">
                        <Link href="/" className="flex items-center space-x-2">
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
                        <Link href="/" className="flex items-center space-x-2">
                            <Image src="/logo.png?v=2" alt="RotaKula Logo" width={28} height={28} />
                            <span className="font-bold font-headline text-lg">RotaKula</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1">
                         {showAdmin && <AdminAuth isMobile={true} />}
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
                    {showAdmin && <AdminAuth />}
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

    
