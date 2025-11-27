/**
 * Component for "BigText" Slices.
 */
const BigText = (): JSX.Element => {
  return (
    <section
      className="min-h-screen w-screen overflow-hidden bg-[#020617] text-sky-500"
    >
      <h2 className="grid w-full gap-[3vw] py-10 text-center font-black uppercase leading-[.7]">
        <div className="text-[32vw]">Precision</div>
        <div className="grid gap-[2vw] text-[34vw] md:flex md:text-[11vw]">
          <span className="inline-block">Control </span>
          <span className="inline-block max-md:text-[27vw]">Power </span>
          <span className="inline-block max-md:text-[40vw]">Performance </span>
        </div>
        <div className="text-[32vw]">Flight</div>
      </h2>
    </section>
  );
};

export default BigText;
