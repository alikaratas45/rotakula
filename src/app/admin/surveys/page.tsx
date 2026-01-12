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
  
  useEffect(() => {
    // Since admin functionality is disabled, always redirect.
    router.push('/');
  }, [router]);

  // This return is for the brief moment before redirection.
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
