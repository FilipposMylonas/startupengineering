import React from "react";
import { FPLogo } from "@/components/FPLogo";

type Props = {};

export default function Header({}: Props) {
  return (
    <header className="-mb-28 flex justify-center items-center py-4 px-6">
      <FPLogo className="z-10 h-20 cursor-pointer text-sky-400" />
    </header>
  );
}
