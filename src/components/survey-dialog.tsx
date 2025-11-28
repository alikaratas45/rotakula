
'use client';

import { useApp } from '@/context/app-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Survey } from './survey';

export default function SurveyDialog() {
  const { surveyState, setSurveyState } = useApp();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSurveyState({ isOpen: false, poi: null });
    }
  };

  if (!surveyState.poi) {
    return null;
  }

  return (
    <Dialog open={surveyState.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ziyaretinizi Değerlendirin: {surveyState.poi.name}</DialogTitle>
          <DialogDescription>
            Deneyiminizi bizimle paylaşarak Kula'yı daha iyi bir yer haline getirmemize yardımcı olun.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
            <Survey 
                poiId={surveyState.poi.id} 
                poiName={surveyState.poi.name} 
                onSubmitted={() => handleOpenChange(false)}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
