'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, increment, setDoc } from 'firebase/firestore';
import { Users } from 'lucide-react';

const VisitorCounter = () => {
    const firestore = useFirestore();
    const [visitorCount, setVisitorCount] = useState<number | null>(null);

    const statsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'stats', 'visitors');
    }, [firestore]);

    const { data: statsData, isLoading } = useDoc<{ count: number }>(statsRef);

    useEffect(() => {
        if (statsData) {
            setVisitorCount(statsData.count);
        }
    }, [statsData]);

    useEffect(() => {
        // Sadece firestore hazır olduğunda ve yükleme bittiğinde çalış
        if (!firestore || !statsRef || isLoading) {
            return;
        }

        try {
            // Ziyaretçinin daha önce ziyaret edip etmediğini kontrol et
            const hasVisited = localStorage.getItem('rota-kula-visited');
            if (!hasVisited) {
                // setDoc'u merge:true ile kullanarak belge yoksa oluştur, varsa güncelle.
                // Bu, "No document to update" hatasını önler.
                setDoc(statsRef, {
                    count: increment(1),
                    lastUpdated: serverTimestamp()
                }, { merge: true })
                .catch(error => console.error("Error incrementing visitor count:", error));

                localStorage.setItem('rota-kula-visited', 'true');
            }
        } catch (error) {
            // localStorage hatalarını yakala
            console.error("Error managing visitor count in localStorage:", error);
        }
    }, [firestore, statsRef, isLoading]); // isLoading'i bağımlılığa ekle
    
    if (visitorCount === null) {
        return (
            <section className="py-12 bg-muted">
                <div className="container mx-auto px-4 md:px-8 text-center">
                    <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                    <h3 className="text-3xl font-bold font-headline text-foreground">
                        Toplam Ziyaretçi
                    </h3>
                    <div className="text-5xl font-bold text-primary mt-2 h-14 bg-muted-foreground/20 rounded-md animate-pulse w-48 mx-auto" />
                </div>
            </section>
        );
    }

    return (
        <section className="py-12 bg-muted">
            <div className="container mx-auto px-4 md:px-8 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-3xl font-bold font-headline text-foreground">
                    Toplam Ziyaretçi
                </h3>
                <p className="text-5xl font-bold text-primary mt-2">
                    {visitorCount.toLocaleString('tr-TR')}
                </p>
            </div>
        </section>
    );
};

export default VisitorCounter;
