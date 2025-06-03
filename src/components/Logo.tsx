import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
      {/* Simple SVG Placeholder Logo - Flat and Outlined Style */}
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h1 className="font-headline text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden">
        Fluxo Financeiro
      </h1>
    </Link>
  );
}
