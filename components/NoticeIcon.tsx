/** Small line icons for notice kinds (no emoji, consistent stroke). */
const paths: Record<string, string> = {
  info: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Zm13-3a5 5 0 0 1 0 8m2.5-10.5a8.5 8.5 0 0 1 0 13',
  bijli: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  pani: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  gas: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .5 2 1.5 3 2.5 3 0-3-1-5 0-8Z',
  safai: 'M14 3 9 13m-3 0h8l1 8H5l1-8Zm2 4v4m4-4v4',
  security: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4',
  meeting: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3 2.7-5 6-5s6 2 6 5m0-4.6c.6-.3 1.3-.4 2-.4 3.3 0 6 2 6 5',
  event: 'M4 7h16v13H4V7Zm0 4h16M8 3v4m8-4v4',
};
export default function NoticeIcon({ kind, className = 'h-5 w-5' }: { kind: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[kind] ?? paths.info} />
    </svg>
  );
}
