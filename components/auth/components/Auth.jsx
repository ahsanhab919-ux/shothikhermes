import Image from "next/image";
import Link from "next/link";

const Auth = ({ title, tag, children }) => {
  return (
    <>
      <div className="relative mb-4 flex flex-col items-center gap-4">
        <div className="relative h-[90px] w-[90px]">
          <Link href="/">
            <Image src="/moscot.png" fill alt="logo" />
          </Link>
        </div>
        <div className="mt-0 flex flex-col items-center gap-3">
          <h1 className="text-center text-3xl leading-9 font-semibold tracking-wide">
            {title}
          </h1>
          <p className="text-muted-foreground text-center text-sm leading-6 font-normal md:text-base">
            {tag}
          </p>
        </div>
      </div>

      {children}
    </>
  );
};

export default Auth;
