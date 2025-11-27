import clsx from "clsx";

type Props = {
  buttonLink?: string;
  buttonText: string | null;
  className?: string;
  onClick?: () => void;
};

export default function Button({ buttonLink, buttonText, className, onClick }: Props) {
  return (
    <a
      href={buttonLink || "#"}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        "rounded-xl bg-sky-600 px-5 py-4 text-center text-xl font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-sky-700 hover:text-white md:text-2xl",
        className,
      )}
    >
      {buttonText}
    </a>
  );
}
