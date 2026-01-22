
import { SVGProps } from 'react';
import { CopyButton } from '../features/copy-button';

const turkishFlagIconCode = `
import { type SVGProps } from 'react';

export function TurkishFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" {...props}>
      <rect width="900" height="600" fill="#E30A17" />
      <circle cx="300" cy="300" r="150" fill="#FFF" />
      <circle cx="337.5" cy="300" r="120" fill="#E30A17" />
      <path
        d="M446.25 300l114.3 35.25-70.65-92.25v114l70.65-92.25-114.3 35.25z"
        fill="#FFF"
      />
    </svg>
  );
}
`;

export default function IconCodePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative bg-muted/30 rounded-lg border p-6">
        <div className="absolute top-4 right-4">
          <CopyButton textToCopy={turkishFlagIconCode.trim()} />
        </div>
        <h1 className="text-2xl font-headline font-bold mb-4">Türk Bayrağı İkon Kodu</h1>
        <p className="mb-4 text-muted-foreground">Bu kodu React (TSX) projelerinizde kullanabilirsiniz. Kodu kullanabilmek için projenizde `SVGProps` tipini `react` kütüphanesinden içe aktarmanız gerekebilir.</p>
        <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90 overflow-auto bg-background p-4 rounded-md">
          <code>
            {turkishFlagIconCode.trim()}
          </code>
        </pre>
      </div>
    </div>
  );
}
