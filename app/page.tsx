"use client";

import { Framed } from "@/components/framed";
import { HandwritingText } from "@/components/handwriting-text";
import { NotebookLines } from "@/components/notebook-lines";
import { HandwritingProvider } from "@/context/handwriting-context";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@/icons/copy";
import { SignatureName } from "@/components/signature-name";

export default function Home() {
  return (
    <div className="relative max-w-[50.5rem] w-full mx-auto min-h-dvh h-full font-shadows-into-light">
      <header className="py-2 flex justify-end">
        <Button variant="primary" size="sm">
          Signature
        </Button>
      </header>
      <main className="mt-[17rem]">
        <HandwritingProvider>
          <div className="flex flex-col gap-[0.9375rem]">
            <div className="relative h-[2.8125rem]">
              <Framed.Svg className="absolute -top-[8.9375rem]">
                <Framed.Image
                  src="/jujustu.jpg"
                  alt="Profile"
                  className="w-[191px] h-[191px] object-cover"
                  unoptimized
                  priority
                />
              </Framed.Svg>
              <div className="relative w-fit ml-auto">
                <NotebookLines width="601" height="45" viewBox="0 0 601 45" />
                <div className="absolute inset-0 flex items-end p-4">
                  <HandwritingText text="Oyerinde Daniel" />
                </div>
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="23-years-old creative male." />
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="Typescript-based software engineer." />
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="I love engineering systems -" />
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="building things that work seamlessly and scale effortlessly." />
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

            <div className="relative w-full">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end w-fit ml-auto pl-4 py-4 pr-[3.4375rem]">
                <HandwritingText
                  className=""
                  text="Contact me: oyerinde.daniel@yahoo.com "
                />
                <Button size="icon">
                  <CopyIcon />
                </Button>
              </div>
            </div>

            <div className="relative">
              <NotebookLines />
              <div className="absolute inset-0 flex items-end pl-4 py-4 pr-[3.6875rem] w-fit ml-auto">
                <HandwritingText
                  as="a"
                  href="https://github.com/oyerindedaniel"
                  target="_blank"
                  text="github  "
                />
                <HandwritingText
                  as="a"
                  href="https://x.com/fybnow"
                  target="_blank"
                  text="twitter  "
                />
                <HandwritingText
                  as="a"
                  href="https://www.linkedin.com/in/daniel-oyerinde-300b53197"
                  target="_blank"
                  text="linkendin"
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
              <NotebookLines />
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
