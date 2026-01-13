
'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Users } from 'lucide-react';

const VisitorCounter = () => {
    const firestore = useFirestore();
    const [visitorCount, setVisitorCount] = useState<number | null>(null);

    const statsRef = useMemoFirebase(() => doc(firestore, 'stats', 'visitors'), [firestore]);

    const { data: initialData, isLoading } = useDoc<{ count: number }>(statsRef);

    useEffect(() => {
        if (initialData !== undefined) {
             setVisitorCount(initialData ? initialData.count : 0);
        }
    }, [initialData]);

    useEffect(() => {
        // Don't do anything until Firebase has loaded the initial data.
        if (isLoading) {
            return;
        }

        const hasVisited = localStorage.getItem('rota-kula-visited');
        if (!hasVisited && firestore) {
            const incrementCount = async () => {
                try {
                    // First, check if the document exists.
                    const docSnap = await getDoc(statsRef);
                    
                    if (docSnap.exists()) {
                        // If it exists, increment the count.
                        await setDoc(statsRef, { 
                            count: increment(1),
                            lastUpdated: serverTimestamp() 
                        }, { merge: true });
                    } else {
                        // If it doesn't exist, create it with a count of 1.
                        await setDoc(statsRef, { 
                            count: 1,
                            lastUpdated: serverTimestamp() 
                        });
                    }
                    localStorage.setItem('rota-kula-visited', 'true');
                } catch (error) {
                    console.error("Error updating visitor count:", error);
                }
            };
            incrementCount();
        }
    }, [isLoading, firestore, statsRef]);
    
    if (isLoading || visitorCount === null) {
        return null; // Or a loading skeleton
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
