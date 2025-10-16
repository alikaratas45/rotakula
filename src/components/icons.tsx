import { Bed, type SVGProps } from "lucide-react";

export function RotaKulaLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
            <path d="M12 22V12" />
            <path d="M20 7l-8 4.5" />
            <path d="M4 7l8 4.5" />
        </svg>
    );
}

export function VolcanoIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M8 3v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V3" />
      <path d="M12 15h.01" />
      <path d="M7 19h10" />
      <path d="m5 19-2-6h18l-2 6" />
      <path d="M10 15a2 2 0 1 1-4 0" />
      <path d="M16 15a2 2 0 1 1-4 0" />
    </svg>
  );
}

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
