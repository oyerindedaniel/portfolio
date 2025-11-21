"use client";

import { HandwritingLine } from "@/components/handwriting-line";
import { Button } from "@/components/ui/button";
import { useClientOnly } from "@/hooks/use-client-only";
import { LoaderIcon } from "@/icons/loader";
import Link from "next/link";

export default function WorkWithMePage() {
  const isClient = useClientOnly(500);

  // @handwriting-line.tsx cannot run on server
  // might change
  if (!isClient) {
    return (
      <div className="relative h-dvh w-full flex items-center justify-center">
        {/* Loader for users */}
        <LoaderIcon size={100} />

        {/* SEO content for crawlers */}
        <div className="sr-only">
          <h1>Work With Me — Oyerinde Daniel</h1>
          <p>
            I’m always open to chatting about full-time roles or project-based
            work — especially where I can help design, build, or refine real
            products.
          </p>
          <p>
            I’m a full-stack developer with 4+ years of experience building
            production-ready web apps, APIs, and platforms. Worked across
            fintech and real-estate products — creating clean user interfaces
            and integrating features like payments, booking flows, user
            management, and other real-world workflows.
          </p>
          <p>
            Comfortable with TypeScript and modern frontend tooling, I enjoy
            building features end-to-end while balancing practical engineering
            with solid architecture.
          </p>
          <p>
            I love working with founders, teams, and early-stage products —
            building new features, improving systems, choosing the right stack,
            or taking an idea from prototype to production.
          </p>
          <p>
            Contact:{" "}
            <a href="mailto:oyerinde.daniel@yahoo.com">
              oyerinde.daniel@yahoo.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-[808px] w-full mx-auto min-h-dvh h-full font-shadows-into-light py-10">
      <Button asChild className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </Button>

      <div className="flex flex-col">
        <HandwritingLine as="h2" className="text-brand-red">
          Work With Me
        </HandwritingLine>

        <HandwritingLine />

        <HandwritingLine>
          I’m always open to chatting about full-time roles or project-based
          work — especially where I can help design, build, or refine real
          products.
        </HandwritingLine>

        <HandwritingLine />

        <HandwritingLine>
          I’m a full-stack developer with 4+ years of experience building
          production-ready web apps, APIs, and platforms. I’ve worked across
          fintech and real-estate products — creating clean user interfaces and
          integrating features like payments, booking flows, user management,
          and other real-world application workflows.
        </HandwritingLine>

        <HandwritingLine />

        <HandwritingLine>
          While I primarily work with TypeScript and modern frontend tooling,
          I’m comfortable across the stack and enjoy building features
          end-to-end in a way that balances practical engineering with solid
          architecture.
        </HandwritingLine>

        <HandwritingLine />

        <HandwritingLine>
          I love working with founders, teams, and early-stage products —
          whether it’s building new features, improving existing systems,
          choosing the right stack, or taking an idea from prototype to
          production. I prefer to work on projects where the goals are clear and
          where I can make a meaningful, visible impact.
        </HandwritingLine>

        <HandwritingLine />

        <HandwritingLine>
          If you'd like to work together or just want to chat, feel free to
          reach out anytime.
        </HandwritingLine>

        <HandwritingLine />

        <HandwritingLine
          as="a"
          href="mailto:oyerinde.daniel@yahoo.com"
          className="text-(--brand-blue) hover:text-(--brand-red) transition-transform duration-200 hover:scale-102 active:scale-95"
        >
          Email me: oyerinde.daniel@yahoo.com
        </HandwritingLine>
      </div>
    </div>
  );
}
