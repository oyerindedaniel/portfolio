"use client";

import { Framed } from "@/components/framed";
import { HandwritingText } from "@/components/handwriting-text";
import { HandwritingProvider } from "@/context/handwriting-context";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@/icons/copy";
import { SignatureName } from "@/components/signature-name";
import jujutsu from "../public/jujustu.jpg";
import { AnimatedNotebookLines } from "@/components/animated-notebook-lines";
import { useCopy } from "@/hooks/use-copy";
import { YourSignature } from "@/components/your-signature";

export default function Home() {
  const { copy, copied, pending } = useCopy();

  return (
    <div className="relative max-w-[50.5rem] w-full mx-auto min-h-dvh h-full font-shadows-into-light">
      <header className="py-2 flex justify-end">
        <YourSignature />
      </header>
      <main className="mt-[17rem]">
        <HandwritingProvider>
          <div className="flex flex-col gap-[0.9375rem]">
            <div className="relative h-[2.8125rem]">
              <Framed.Svg className="absolute -top-[8.8375rem] group/framed">
                <Framed.Image
                  src={jujutsu}
                  alt="Profile"
                  className="w-[188px] h-[187px] object-cover"
                  unoptimized
                  priority
                  placeholder="blur"
                />
              </Framed.Svg>
              <div className="relative w-fit ml-auto">
                <AnimatedNotebookLines
                  width="601"
                  height="45"
                  viewBox="0 0 601 45"
                />
                <div className="absolute inset-0 flex items-end p-4">
                  <HandwritingText text="Oyerinde Daniel" />
                </div>
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="2*-years-old creative male." />
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="Typescript-based software engineer." />
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="I love engineering systems -" />
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="building things that work seamlessly and scale effortlessly." />
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end w-fit ml-auto pl-4 py-4 pr-[3.4375rem]">
                <HandwritingText text="Contact me: oyerinde.daniel@yahoo.com " />
                <Button
                  variant="none"
                  onClick={() => copy("oyerinde.daniel@yahoo.com")}
                  disabled={pending}
                  size="icon"
                >
                  <CopyIcon />
                </Button>
              </div>
            </div>

            <div className="relative">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end pl-4 py-4 pr-[3.6875rem] w-fit ml-auto">
                <HandwritingText
                  as="a"
                  href="https://github.com/oyerindedaniel"
                  target="_blank"
                  text="github  "
                  className="hover:text-black transition-transform duration-200 hover:scale-105 active:scale-95"
                />
                <HandwritingText
                  as="a"
                  href="https://x.com/fybnow"
                  target="_blank"
                  text="twitter  "
                  className="hover:text-black transition-transform duration-200 hover:scale-105 active:scale-95"
                />
                <HandwritingText
                  as="a"
                  href="https://www.linkedin.com/in/daniel-oyerinde-300b53197"
                  target="_blank"
                  text="linkendin"
                  className="hover:text-black transition-transform duration-200 hover:scale-105 active:scale-95"
                />
                {/* <HandwritingText
                  as="a"
                  href="https://x.com/fybnow"
                  target="_blank"
                  text="resume"
                /> */}
              </div>
            </div>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>
          </div>
        </HandwritingProvider>
      </main>
      <footer className="p-8">
        <SignatureName />
      </footer>
    </div>
  );
}
