
"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const TourSteps = [
  { path: '/routes/historic-kula-walking-tour', delay: 10000 },
  { path: '/create-route', delay: 10000 },
  { path: '/stories', delay: 8000 },
  { path: '/nearby', delay: 8000 },
  { path: '/', action: 'startAudioGuide', delay: 8000 },
  { path: '/', action: 'stopAudioGuide', delay: 4000 },
];

export default function IntroTour() {
  const { language, translations, isTourActive, setIsTourActive, setIsAudioGuideActive } = useLanguage();
  const router = useRouter();
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [showWelcomeBox, setShowWelcomeBox] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const stopTour = useCallback((navigateToHome = true) => {
    setIsTourActive(false);
    setIsAudioGuideActive(false); 
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (navigateToHome && window.location.pathname !== '/') {
        router.push('/');
    }
  }, [router, setIsTourActive, setIsAudioGuideActive]);

  useEffect(() => {
    if (!isTourActive) {
      return;
    }
    
    setShowWelcomeBox(true);
    const welcomeTimeout = setTimeout(() => {
      setShowWelcomeBox(false);
    }, 2000);


    const narrationText = translations.tour.narration.join(' ');
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utteranceRef.current = utterance;
    
    utterance.lang = language;
    const voices = synthRef.current?.getVoices();
    if (voices) {
      const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
      if (voice) utterance.voice = voice;
    }
    
    const startPlayback = () => {
        if (synthRef.current) {
          synthRef.current.speak(utterance);
        }
    }

    if (synthRef.current && synthRef.current.getVoices().length > 0) {
        startPlayback();
    } else if (synthRef.current) {
        synthRef.current.onvoiceschanged = startPlayback;
    }

    let cumulativeDelay = 0;
    TourSteps.forEach((step) => {
      cumulativeDelay += step.delay;
      timeoutRef.current = setTimeout(() => {
        if(document.hidden) return;
        const activeCheck = (document.getElementById('tour-skip-button')?.dataset.active === 'true');
        if(!activeCheck) return;

        if (step.action === 'startAudioGuide') {
            setIsAudioGuideActive(true);
        } else if (step.action === 'stopAudioGuide') {
            setIsAudioGuideActive(false);
        }

        if (router && step.path) {
          router.push(step.path);
        }

      }, cumulativeDelay);
    });

    utterance.onend = () => {
      stopTour(false); 
    };
    
    return () => {
       if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      clearTimeout(welcomeTimeout);
      setIsAudioGuideActive(false);
    }

  }, [isTourActive, language, translations.tour.narration, router, stopTour, setIsAudioGuideActive]);


  if (!isTourActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <div className="absolute bottom-10 right-10 pointer-events-auto">
        <Button onClick={() => stopTour()} variant="destructive" size="lg" id="tour-skip-button" data-active={isTourActive}>
          <X className="mr-2 h-5 w-5" />
          {translations.tour.skip}
        </Button>
      </div>
      {showWelcomeBox && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80 p-6 rounded-lg shadow-2xl max-w-md text-center animate-fade-in">
            <h2 className="text-2xl font-bold font-headline mb-2">{translations.tour.title}</h2>
            <p className="text-muted-foreground">{translations.tour.description}</p>
        </div>
      )}
    </div>
  );
}
