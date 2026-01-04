"use client";

import { motion } from "framer-motion";
import React from "react";

interface RollingTextProps {
  text?: string;
  speed?: number;
  className?: string;
  duration?: number;
}

const Skiper27 = () => {
  return (
    <section className="h-full snap-y snap-mandatory overflow-y-scroll">
      <div className="text-foreground absolute left-1/2 top-[10%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
        <span className="after:from-foreground after:to-background relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:content-['']">
          scroll down to see
        </span>
      </div>
      <div className="flex h-full w-full snap-start flex-col items-center justify-center">
        <RollingText text="CRAZY" speed={0.05} duration={4} />
        <RollingText text="COMPONENTS" speed={0.05} duration={4} />
      </div>
      <div className="flex h-full w-full snap-start flex-col items-center justify-center">
        <RollingText text="FOR" speed={0.05} duration={4} />
        <RollingText text="YOUR" speed={0.05} duration={4} />
        <RollingText text="NEXTJS" speed={0.05} duration={4} />
        <RollingText text="PROJECT" speed={0.05} duration={4} />
      </div>
      <div className="flex h-full w-full snap-start flex-col items-center justify-center">
        <RollingText text="SKIPER UI PRO" speed={0.05} duration={4} />
      </div>
    </section>
  );
};

export { Skiper27 };

function RollingText({
  text = "ROLLING",
  speed = 0.1,
  className = " text-5xl  sm:text-7xl lg:text-8xl  font-bold",
  duration = 4,
}: RollingTextProps) {
  const centerIndex = Math.floor(text.length / 2);

  return (
    <motion.div className={`font-custom flex ${className}`}>
      {text.split("").map((letter, index) => {
        const distanceFromCenter = Math.abs(index - centerIndex);
        const delay = distanceFromCenter * speed;
        const rollDuration = 0.2 + distanceFromCenter * 0.15;
        const numberOfRolls = Math.floor(duration / rollDuration);
        const totalMovement = numberOfRolls * 1.2;

        return (
          <div
            key={index}
            className="relative inline-block overflow-hidden"
            style={{ height: "1em" }}
          >
            <motion.h1
              className="flex flex-col"
              whileInView={{
                y: `-${totalMovement}em`,
              }}
              transition={{
                duration: duration,
                ease: [0.15, 1, 0.1, 1],
                delay: delay,
              }}
            >
              {Array(numberOfRolls + 2)
                .fill(null)
                .map((_, copyIndex) => (
                  <span
                    key={copyIndex}
                    className="flex shrink-0 items-center justify-center"
                    style={{ height: "1.2em" }}
                  >
                    {letter}
                  </span>
                ))}
            </motion.h1>
          </div>
        );
      })}
    </motion.div>
  );
}

/**
 * Skiper 27 RollingText — React + framer motion
 * Inspired by and adapted from https://www.siena.film/
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 * These animations aren’t associated with the siena.film . They’re independent recreations meant to study interaction design
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.in
 * Twitter: https://x.com/Gur__vi
 */
