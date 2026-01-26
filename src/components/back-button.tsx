'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '@/context/app-context';

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  const { translations } = useApp();

  return (
    <Button variant="outline" onClick={() => router.back()} className={className}>
      <ChevronLeft className="mr-2 h-4 w-4" />
      {translations.common.back || 'Geri'}
    </Button>
  );
}
