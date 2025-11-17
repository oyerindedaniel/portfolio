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
import { Path } from "@/components/path";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useClientOnly } from "@/hooks/use-client-only";
import { cn } from "@/lib/cn";
import { HandwritingLine } from "@/components/handwriting-line";
import { JUJUTSU_BLUR_DATA_URL } from "@/constants/blur-data";
import { LoaderIcon } from "@/icons/loader";

export default function Home() {
  const { copy, copied, pending } = useCopy();
  const isClient = useClientOnly(500);

  const isMax808 = useMediaQuery("(max-width: 856px)"); // Collapse frame when viewport ≤ content + px-6 padding (808 + 24*2)

  // @handwriting-line.tsx cannot run on server
  // might change
  if (!isClient) {
    return (
      <div className="h-dvh w-full flex items-center justify-center">
        <LoaderIcon size={100} />
      </div>
    );
  }

  return (
    <div className="relative max-w-[808px] w-full mx-auto min-h-dvh h-full font-shadows-into-light">
      <header className="py-2 flex justify-end">
        <Path />
      </header>

      <main className="mt-[272px]">
        <HandwritingProvider>
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
            {/* <HandwritingLine>Currently learning Python.</HandwritingLine> */}
            <HandwritingLine>I love engineering systems-</HandwritingLine>
            <HandwritingLine>
              building software that work seamlessly and scale effortlessly.
            </HandwritingLine>

            <div className="relative w-full">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

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

            <div className="relative w-full min-[600px]:hidden">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end p-4">
                <HandwritingText text="" />
              </div>
            </div>

            <div className="relative w-full ">
              <AnimatedNotebookLines />
              <div className="absolute inset-0 flex items-end w-fit ml-auto pl-4 py-4 pr-[55px]">
                <HandwritingText text="Contact me: oyerinde.daniel@yahoo.com " />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="169 0 259 200"
                  preserveAspectRatio="none"
                  className="absolute top-0 left-0 w-40 h-full "
                >
                  <path
                    d="M 299.2395935058594 35.0625 L 273.2395935058594 38.395843505859375 L 247.23959350585938 41.0625 L 231.23959350585938 44.395843505859375 L 216.57290649414062 47.72917175292969 L 200.57290649414062 55.72917175292969 L 192.57290649414062 61.0625 L 181.23959350585938 71.0625 L 172.57290649414062 87.0625 L 169.90625 95.0625 L 169.90625 100.39584350585938 L 169.90625 121.0625 L 171.90625 134.39584350585938 L 175.90625 140.39584350585938 L 187.90628051757812 150.39584350585938 L 201.90628051757812 159.0625 L 215.23959350585938 162.39584350585938 L 228.57290649414062 165.0625 L 248.57290649414062 168.39584350585938 L 263.2395935058594 169.0625 L 278.5729064941406 168.39584350585938 L 304.5729064941406 167.72918701171875 L 320.5729064941406 167.0625 L 335.2395935058594 167.0625 L 358.5729064941406 164.39584350585938 L 370.5729064941406 158.39584350585938 L 378.5729064941406 153.0625 L 395.2395935058594 142.39584350585938 L 402.5729064941406 136.39584350585938 L 411.2395935058594 127.72918701171875 L 417.2395935058594 118.39584350585938 L 419.9062805175781 113.0625 L 420.5729064941406 101.72918701171875 L 411.9062805175781 89.0625 L 396.5729064941406 73.0625 L 373.2395935058594 50.395843505859375 L 361.2395935058594 41.0625 L 348.5729064941406 33.72917175292969 L 332.5729064941406 29.0625 L 320.5729064941406 27.0625 L 301.9062805175781 27.0625 L 291.2395935058594 25.0625 L 274.5729064941406 24.395843505859375 L 263.9062805175781 24.395843505859375 L 252.57290649414062 26.395843505859375 L 244.57290649414062 30.395843505859375 L 202.57290649414062 53.0625 L 186.57290649414062 69.0625 L 177.90625 81.72918701171875 L 173.23959350585938 95.72918701171875 L 186.57290649414062 123.0625 L 209.90628051757812 135.0625 L 245.23959350585938 157.0625 L 255.23959350585938 163.72918701171875 L 279.9062805175781 171.0625 L 300.5729064941406 176.39584350585938 L 322.5729064941406 180.39584350585938 L 343.2395935058594 180.39584350585938 L 366.5729064941406 177.72918701171875 L 377.2395935058594 177.72918701171875 L 386.5729064941406 175.0625 L 402.5729064941406 163.72918701171875 L 413.9062805175781 157.0625 L 419.9062805175781 147.0625 L 423.2395935058594 141.0625 L 425.9062805175781 134.39584350585938 L 427.2395935058594 125.0625 L 428.5729064941406 114.39584350585938 L 424.5729064941406 101.72918701171875 L 407.9062805175781 84.39584350585938 L 384.5729064941406 61.0625 L 373.9062805175781 53.72917175292969 L 362.5729064941406 45.0625 L 339.9062805175781 35.72917175292969 L 330.5729064941406 30.395843505859375 L 317.2395935058594 25.729171752929688 L 295.9062805175781 20.395843505859375 L 289.9062805175781 19.0625 L 273.9062805175781 19.0625 L 259.9062805175781 26.395843505859375 L 248.57290649414062 33.0625 L 231.23959350585938 49.72917175292969 L 219.90628051757812 55.72917175292969 L 207.90628051757812 63.0625 L 201.23959350585938 67.0625 L 197.90628051757812 71.72918701171875 L 195.23959350585938 77.0625 L 193.23959350585938 88.39584350585938 L 193.23959350585938 101.0625 L 193.23959350585938 112.39584350585938"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    id="sig_path_5"
                    stroke="var(--brand-red)"
                    strokeWidth="4px"
                    strokeDasharray="1437.8565673828125"
                    strokeDashoffset="1437.8565673828125"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="1437.8565673828125"
                      to="0"
                      dur="2.00s"
                      begin="0.00s"
                      fill="freeze"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
                <Button
                  type="button"
                  variant="none"
                  onClick={() => copy("oyerinde.daniel@yahoo.com")}
                  disabled={pending}
                  size="icon"
                >
                  <CopyIcon />
                </Button>
              </div>
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
