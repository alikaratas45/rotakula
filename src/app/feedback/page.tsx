
'use client';

import { FeedbackSection } from '@/components/feedback';
import { BackButton } from '@/components/back-button';

export default function FeedbackPage() {
  return (
    <div className="container px-4 py-8 md:py-12">
      <BackButton className="mb-8" />
      <div className="max-w-4xl mx-auto">
        <FeedbackSection />
      </div>
    </div>
  );
}
