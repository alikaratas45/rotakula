
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/app-context";

export function Footer() {
    const { translations, isAdmin, handleAdminLogin } = useApp();
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const currentYear = new Date().getFullYear();

    const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleAdminLogin(username, password);
        setShowLoginDialog(false);
        setUsername("");
        setPassword("");
    };

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
                {isAdmin ? (
                    <Link
                        href="/admin/pois"
                        className="text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                    >
                        Admin Paneli
                    </Link>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => setShowLoginDialog(true)}
                    >
                        Yönetim Girişi
                    </Button>
                )}
            </div>
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleLoginSubmit}>
                        <DialogHeader>
                            <DialogTitle>Yönetim Girişi</DialogTitle>
                            <DialogDescription>
                                Yönetim paneline erişmek için kullanıcı adı ve şifrenizi girin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="footer-admin-username">Kullanıcı adı veya e-posta</Label>
                                <Input
                                    id="footer-admin-username"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="footer-admin-password">Şifre</Label>
                                <Input
                                    id="footer-admin-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Giriş Yap</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </footer>
    );
}
