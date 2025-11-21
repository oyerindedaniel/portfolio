"use client";

import { Framed } from "@/components/framed";
import { HandwritingText } from "@/components/handwriting-text";
import { HandwritingProvider } from "@/context/handwriting-context";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@/icons/copy";
import { CheckIcon } from "@/icons/check";
import { SignatureName } from "@/components/signature-name";
import jujutsu from "../public/jujustu.jpg";
import { AnimatedNotebookLines } from "@/components/animated-notebook-lines";
import { useCopy } from "@/hooks/use-copy";
import { Path } from "@/components/path";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useClientOnly } from "@/hooks/use-client-only";
import { cn } from "@/lib/cn";
import { HandwritingLine } from "@/components/handwriting-line";
import { JUJUTSU_BLUR_DATA_URL } from "@/constants/blur-data";
import { LoaderIcon } from "@/icons/loader";
import Link from "next/link";

export default function Home() {
  const { copy, copied, pending } = useCopy();
  const isClient = useClientOnly(500);

  const isMax808 = useMediaQuery("(max-width: 856px)"); // Collapse frame when viewport ≤ content + px-6 padding (808 + 24*2)

  // @handwriting-line.tsx cannot run on server
  // might change
  if (!isClient) {
    return (
      <div className="relative h-dvh w-full flex items-center justify-center">
        {/* Loader for users */}
        <LoaderIcon size={100} />

        {/* SEO content for crawlers */}
        <div className="sr-only">
          <h1>Oyerinde Daniel</h1>
          <p>2*-years-old creative male. Full-Stack TypeScript Engineer.</p>
          <p>
            I love engineering systems—building software that works seamlessly
            and scales effortlessly.
          </p>

          <h2>Projects</h2>
          <p>
            <a
              href="https://clip-editor-six.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Clip Editor (wip)
            </a>
          </p>

          <h2>Contact</h2>
          <p>
            Email:{" "}
            <a href="mailto:oyerinde.daniel@yahoo.com">
              oyerinde.daniel@yahoo.com
            </a>
          </p>

          <h2>Social</h2>
          <p>
            <a
              href="https://github.com/oyerindedaniel"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            ,{" "}
            <a
              href="https://x.com/fybnow"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            ,{" "}
            <a
              href="https://www.linkedin.com/in/daniel-oyerinde-300b53197"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-[808px] w-full mx-auto min-h-dvh h-full font-shadows-into-light">
      <header className="py-4 flex items-center justify-end gap-8">
        <Button variant="red" size="sm" asChild>
          <Link href="/work-with-me">Work with me</Link>
        </Button>

        <Path />
      </header>

      <main className="mt-[272px]">
        <div className="flex flex-col gap-[15px]">
          <div className="relative">
            <Framed.Svg className="absolute -top-[141.4px] group/framed max-[calc(808px+48px)]:-top-[12.5875rem] transition-[top] ease-in duration-300">
              <Framed.Image
                src={jujutsu}
                alt="Profile"
                className="w-[188px] h-[187px] object-cover"
                unoptimized
                priority
                placeholder="blur"
                blurDataURL={JUJUTSU_BLUR_DATA_URL}
              />
            </Framed.Svg>
            <div
              className={cn(
                "relative w-full ml-auto",
                isMax808 ? "max-w-[808px]" : "max-w-[601px]"
              )}
            >
              <AnimatedNotebookLines
                maxWidth={isMax808 ? 808 : 601}
                height={45}
              />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText as="h1" text="Oyerinde Daniel" />
              </div>
            </div>
          </div>

          <HandwritingLine>2*-years-old creative male.</HandwritingLine>
          <HandwritingLine>Full-Stack TypeScript Engineer.</HandwritingLine>
          {/* <HandwritingLine>Currently learning Several things.</HandwritingLine> */}
          <HandwritingLine>I love engineering systems-</HandwritingLine>
          <HandwritingLine>
            building software that work seamlessly and scale effortlessly.
          </HandwritingLine>

          <HandwritingLine />

          <div className="relative w-full">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex items-end p-4">
              <HandwritingText as="h2" text="Project(s)" />
            </div>
          </div>

          <HandwritingLine
            as="a"
            href="https://clip-editor-six.vercel.app"
            target="_blank"
            text="Clip Editor (wip)"
            className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
          />

          <div className="relative w-full">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex items-end p-4">
              <HandwritingText text="" />
            </div>
          </div>

          <div className="relative">
            <HandwritingLine
              side={isMax808 ? "left" : "right"}
              highlight
              copy={
                <Button
                  type="button"
                  variant="none"
                  onClick={(e) => {
                    copy("oyerinde.daniel@yahoo.com");
                  }}
                  disabled={pending}
                  size="icon"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              }
            >
              Contact me: oyerinde.daniel@yahoo.com
            </HandwritingLine>
          </div>

          <div className="relative max-[600px]:hidden">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex  items-end pl-4 py-4 pr-[59px] w-fit ml-auto">
              <HandwritingText
                as="a"
                href="https://github.com/oyerindedaniel"
                target="_blank"
                text="github  "
                className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
              />
              <HandwritingText
                as="a"
                href="https://x.com/fybnow"
                target="_blank"
                text="twitter  "
                className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
              />
              <HandwritingText
                as="a"
                href="https://www.linkedin.com/in/daniel-oyerinde-300b53197"
                target="_blank"
                text="linkendin "
                className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
              />
            </div>
          </div>

          <div className="relative w-full max-[600px]:block hidden">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex items-end p-4 w-fit ml-auto">
              <HandwritingText
                as="a"
                href="https://github.com/oyerindedaniel"
                target="_blank"
                text="github  "
                className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
              />
            </div>
          </div>

          <div className="relative w-full max-[600px]:block hidden">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex items-end p-4 w-fit ml-auto">
              <HandwritingText
                as="a"
                href="https://x.com/fybnow"
                target="_blank"
                text="twitter  "
                className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
              />
            </div>
          </div>

          <div className="relative w-full max-[600px]:block hidden">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex items-end p-4 w-fit ml-auto">
              <HandwritingText
                as="a"
                href="https://www.linkedin.com/in/daniel-oyerinde-300b53197"
                target="_blank"
                text="linkendin"
                className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
              />
            </div>
          </div>

          <div className="relative w-full max-[600px]:block hidden">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex items-end p-4 w-fit ml-auto">
              <HandwritingText
                as="a"
                href="mailto:oyerinde.daniel@yahoo.com"
                target="_blank"
                text="Email me"
                className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
              />
            </div>
          </div>

          <div className="relative w-full">
            <AnimatedNotebookLines />
            <div className="absolute inset-0 flex items-end p-4">
              <HandwritingText text="" />
            </div>
          </div>
        </div>
      </main>
      <footer className="p-8">
        <SignatureName />
      </footer>
    </div>
  );
}
