import { Bed, Play, Pause, type SVGProps } from "lucide-react";

export function HistoricHouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
      <path d="M8 18h8" />
      <path d="M10 11h4" />
      <path d="M2 9h20" />
    </svg>
  );
}

export function FoodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z" />
      <path d="M21 15v6" />
      <path d="M15 15h.01" />
    </svg>
  );
}

export function BedIcon(props: SVGProps<SVGSVGElement>) {
  return <Bed {...props} />;
}


export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Play {...props} />
  );
}

export function PauseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Pause {...props} />
  );
}

export function CustomMenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="2" x2="22" y1="6" y2="6" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <line x1="2" x2="22" y1="18" y2="18" />
    </svg>
  );
}

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

export function UKFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" {...props}>
      <clipPath id="a">
        <path d="M0 0h60v30H0z" />
      </clipPath>
      <clipPath id="b">
        <path d="M30 15h30v15H0V0h30z" />
      </clipPath>
      <path d="M0 0v30h60V0z" fill="#00247d" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0 0l60 30m0-30L0 30"
        clipPath="url(#b)"
        stroke="#cf142b"
        strokeWidth="4"
      />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#cf142b" strokeWidth="6" />
    </svg>
  );
}
