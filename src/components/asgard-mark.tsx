export function AsgardMark({ className = "h-16 w-auto max-w-[220px]" }: { className?: string }) {
  return (
    <img
      src="/logo-asgard.png"
      alt="ASGARD ESTUDIO"
      className={`object-contain ${className}`}
    />
  );
}
