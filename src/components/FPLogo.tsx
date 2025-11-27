import Image from "next/image";

type Props = {
  className?: string;
};

export function FPLogo({ className }: Props) {
  return (
    <div className={className}>
      <Image
        src="/images/StartupEngineeringLogo.png"
        alt="Startup Engineering Logo"
        width={300}
        height={100}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
