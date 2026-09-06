import kspLogoSrc from "@/assets/ksp_logo.svg";

export function KspEmblem({ className = "size-12" }: { className?: string }) {
  return (
    <img
      src={kspLogoSrc || "./ksp_logo.svg"}
      alt="Karnataka State Police Coat of Arms Emblem"
      className={`${className} object-contain`}
      loading="eager"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fallbackLevel) {
          img.dataset.fallbackLevel = "1";
          img.src = "./ksp_logo.svg";
        } else if (img.dataset.fallbackLevel === "1") {
          img.dataset.fallbackLevel = "2";
          img.src = "/app/ksp_logo.svg";
        } else if (img.dataset.fallbackLevel === "2") {
          img.dataset.fallbackLevel = "3";
          img.src = "/ksp_logo.svg";
        }
      }}
    />
  );
}
