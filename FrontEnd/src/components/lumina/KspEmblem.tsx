export function KspEmblem({ className = "size-12" }: { className?: string }) {
  return (
    <img
      src="/ksp_logo.svg"
      alt="Karnataka State Police Coat of Arms Emblem"
      className={`${className} object-contain`}
      loading="eager"
    />
  );
}
