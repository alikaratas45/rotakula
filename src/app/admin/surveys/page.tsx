
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/app-context';
import { Loader2 } from 'lucide-react';

const AdminSurveyDashboard = dynamic(
    () => import('./AdminSurveyDashboard').then(mod => mod.default),
    { 
        ssr: false,
        loading: () => (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
);


export default function SurveyResultsPage() {
  const router = useRouter();
  const { isAdmin, isUserLoading } = useApp();
  
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isUserLoading, router]);

  if (isUserLoading || !isAdmin) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return <AdminSurveyDashboard />;
}
