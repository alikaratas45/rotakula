"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Loader2, Volume2 } from "lucide-react";
import type { PointOfInterest } from "@/lib/types";

interface ProximityDialogProps {
  poi: PointOfInterest | null;
  isGenerating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProximityDialog({ poi, isGenerating, onConfirm, onCancel }: ProximityDialogProps) {
  return (
    <AlertDialog open={!!poi} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            Keşif Zamanı!
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold">{poi?.name}</span> noktasına yaklaştınız. Bu yer hakkında size sesli bilgi vermemi ister misiniz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isGenerating}>
            Hayır, teşekkürler
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Hazırlanıyor...
              </>
            ) : (
              "Evet, dinle"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
