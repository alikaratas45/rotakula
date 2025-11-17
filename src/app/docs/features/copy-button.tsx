
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      toast({
        title: 'Kopyalandı!',
        description: 'Prompt metni panoya kopyalandı.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Metin kopyalanamadı.',
        variant: 'destructive',
      });
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button onClick={handleCopy} variant="outline" size="sm">
      {isCopied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-500" />
          Kopyalandı
        </>
      ) : (
        <>
          <Clipboard className="mr-2 h-4 w-4" />
          Kopyala
        </>
      )}
    </Button>
  );
}
