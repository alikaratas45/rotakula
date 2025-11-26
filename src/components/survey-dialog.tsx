
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, Smile, Meh, Frown, ThumbsUp, ThumbsDown, HelpCircle, Trash2, Leaf, Siren, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';


type SurveyAnswers = {
  rating: string | null;
  cleanliness: string | null;
  recommend: string | null;
  guided: string | null;
  importance: string | null;
};

export default function SurveyDialog() {
  const { translations, poiToSurvey, setPoiToSurvey, addCompletedSurvey } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<SurveyAnswers>({
    rating: null,
    cleanliness: null,
    recommend: null,
    guided: null,
    importance: null,
  });

  const surveysColRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'surveys') : null),
    [firestore]
  );

  useEffect(() => {
    if (poiToSurvey) {
      setOpen(true);
    }
  }, [poiToSurvey]);

  const handleClose = () => {
    setOpen(false);
    // Add a delay to allow the dialog to animate out before clearing the POI
    setTimeout(() => {
        setPoiToSurvey(null);
        // Reset answers for the next survey
        setAnswers({ rating: null, cleanliness: null, recommend: null, guided: null, importance: null });
    }, 300);
  };

  const handleSubmit = () => {
    if (poiToSurvey && surveysColRef) {
        addDocumentNonBlocking(surveysColRef, {
            poiId: poiToSurvey.id,
            poiName: poiToSurvey.name,
            answers: answers,
            createdAt: serverTimestamp(),
        });
        
        addCompletedSurvey(poiToSurvey.id);
        
        toast({
            title: translations.survey.thankYouTitle,
            description: translations.survey.thankYouDescription,
        });
    }
    handleClose();
  };

  if (!poiToSurvey) {
    return null;
  }

  const isSubmitDisabled = !answers.rating || !answers.cleanliness || !answers.recommend || !answers.guided || !answers.importance;

  const ratingOptions = [
    { value: '5', label: translations.survey.rating.veryGood, icon: <Smile className="text-green-500" /> },
    { value: '4', label: translations.survey.rating.good, icon: <Smile className="text-lime-500" /> },
    { value: '3', label: translations.survey.rating.average, icon: <Meh className="text-yellow-500" /> },
    { value: '2', label: translations.survey.rating.bad, icon: <Frown className="text-orange-500" /> },
    { value: '1', label: translations.survey.rating.veryBad, icon: <Frown className="text-red-500" /> },
  ];

  const cleanlinessOptions = [
    { value: 'good', label: translations.survey.rating.good, icon: <Leaf className="text-green-500" /> },
    { value: 'average', label: translations.survey.rating.average, icon: <Siren className="text-yellow-500" /> },
    { value: 'bad', label: translations.survey.rating.bad, icon: <Trash2 className="text-red-500" /> },
  ];

  const recommendOptions = [
    { value: 'yes', label: translations.survey.recommend.yes, icon: <ThumbsUp className="text-green-500" /> },
    { value: 'no', label: translations.survey.recommend.no, icon: <ThumbsDown className="text-red-500" /> },
    { value: 'notSure', label: translations.survey.recommend.notSure, icon: <HelpCircle className="text-gray-500" /> },
  ];

  const guidedOptions = [
      { value: 'yes', label: translations.survey.recommend.yes, icon: <UserCheck className="text-green-500" /> },
      { value: 'no', label: translations.survey.recommend.no, icon: <UserX className="text-red-500" /> },
  ]

  const importanceOptions = [
      { value: '1', icon: <Star className="text-muted-foreground" />},
      { value: '2', icon: <Star className="text-muted-foreground" />},
      { value: '3', icon: <Star className="text-muted-foreground" />},
      { value: '4', icon: <Star className="text-muted-foreground" />},
      { value: '5', icon: <Star className="text-muted-foreground" />},
  ]


  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{translations.survey.title}</DialogTitle>
          <DialogDescription>
            {translations.survey.description.replace('{poiName}', poiToSurvey.name)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 overflow-y-auto pr-2 -mr-4">
          
          {/* Question 1: Rating */}
          <div className="space-y-3">
            <Label className="font-semibold">{translations.survey.question1}</Label>
            <RadioGroup
              value={answers.rating || ''}
              onValueChange={(value) => setAnswers(prev => ({...prev, rating: value}))}
              className="flex justify-around"
            >
              {ratingOptions.map(opt => (
                <div key={`rating-${opt.value}`} className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value={opt.value} id={`rating-${opt.value}`} className="sr-only" />
                  <Label htmlFor={`rating-${opt.value}`} className="flex flex-col items-center gap-2 p-2 rounded-md border-2 border-transparent data-[state=checked]:border-primary cursor-pointer transition-colors">
                     {opt.icon}
                     <span className="text-xs font-medium">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Question 2: Cleanliness */}
           <div className="space-y-3">
            <Label className="font-semibold">{translations.survey.question2}</Label>
            <RadioGroup
              value={answers.cleanliness || ''}
              onValueChange={(value) => setAnswers(prev => ({...prev, cleanliness: value}))}
              className="grid grid-cols-3 gap-4"
            >
              {cleanlinessOptions.map(opt => (
                <div key={`clean-${opt.value}`}>
                  <RadioGroupItem value={opt.value} id={`clean-${opt.value}`} className="sr-only" />
                  <Label htmlFor={`clean-${opt.value}`} className="flex items-center justify-center gap-2 p-3 rounded-md border-2 border-muted data-[state=checked]:border-primary cursor-pointer transition-colors">
                     {opt.icon}
                     <span className="font-medium">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Question 3: Recommendation */}
          <div className="space-y-3">
            <Label className="font-semibold">{translations.survey.question3}</Label>
             <RadioGroup
              value={answers.recommend || ''}
              onValueChange={(value) => setAnswers(prev => ({...prev, recommend: value}))}
              className="grid grid-cols-3 gap-4"
            >
              {recommendOptions.map(opt => (
                <div key={`rec-${opt.value}`}>
                  <RadioGroupItem value={opt.value} id={`rec-${opt.value}`} className="sr-only" />
                  <Label htmlFor={`rec-${opt.value}`} className="flex items-center justify-center gap-2 p-3 rounded-md border-2 border-muted data-[state=checked]:border-primary cursor-pointer transition-colors">
                     {opt.icon}
                     <span className="font-medium">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
           {/* Question 4: Guided */}
          <div className="space-y-3">
            <Label className="font-semibold">{translations.survey.question4}</Label>
             <RadioGroup
              value={answers.guided || ''}
              onValueChange={(value) => setAnswers(prev => ({...prev, guided: value}))}
              className="grid grid-cols-2 gap-4"
            >
              {guidedOptions.map(opt => (
                <div key={`guided-${opt.value}`}>
                  <RadioGroupItem value={opt.value} id={`guided-${opt.value}`} className="sr-only" />
                  <Label htmlFor={`guided-${opt.value}`} className="flex items-center justify-center gap-2 p-3 rounded-md border-2 border-muted data-[state=checked]:border-primary cursor-pointer transition-colors">
                     {opt.icon}
                     <span className="font-medium">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

           {/* Question 5: Importance */}
          <div className="space-y-3">
            <Label className="font-semibold">{translations.survey.question5}</Label>
            <RadioGroup
              value={answers.importance || ''}
              onValueChange={(value) => setAnswers(prev => ({...prev, importance: value}))}
              className="flex justify-around"
            >
              {importanceOptions.map(opt => (
                <div key={`importance-${opt.value}`} className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value={opt.value} id={`importance-${opt.value}`} className="sr-only" />
                  <Label htmlFor={`importance-${opt.value}`} className="flex flex-col items-center gap-2 p-2 rounded-md border-2 border-transparent data-[state=checked]:border-primary cursor-pointer transition-colors">
                     <Star className={`transition-colors ${answers.importance && parseInt(answers.importance) >= parseInt(opt.value) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                     <span className="text-xs font-medium">{opt.value}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="ghost" onClick={handleClose}>{translations.common.close}</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {translations.common.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
