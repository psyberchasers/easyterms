"use client";

import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";

// Dummy placeholder images using picsum.photos
const images = [
  "https://picsum.photos/seed/1/400/600",
  "https://picsum.photos/seed/2/400/600",
  "https://picsum.photos/seed/3/400/600",
  "https://picsum.photos/seed/4/400/600",
  "https://picsum.photos/seed/5/400/600",
  "https://picsum.photos/seed/6/400/600",
  "https://picsum.photos/seed/7/400/600",
  "https://picsum.photos/seed/8/400/600",
  "https://picsum.photos/seed/9/400/600",
  "https://picsum.photos/seed/10/400/600",
  "https://picsum.photos/seed/11/400/600",
  "https://picsum.photos/seed/12/400/600",
  "https://picsum.photos/seed/13/400/600",
];

const Skiper30 = () => {
  const gallery = useRef<HTMLDivElement>(null);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });

  const { scrollYProgress } = useScroll({
    target: gallery,
    offset: ["start end", "end start"],
  });

  const { height } = dimension;
  const y = useTransform(scrollYProgress, [0, 1], [0, height * 2]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, height * 3.3]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, height * 1.25]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, height * 3]);

  useEffect(() => {
    const lenis = new Lenis();

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    const resize = () => {
      setDimension({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", resize);
    requestAnimationFrame(raf);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={gallery}
      className="relative box-border flex h-[175vh] gap-[2vw] overflow-hidden p-[2vw]"
    >
      <Column images={[images[0], images[1], images[2]]} y={y} />
      <Column images={[images[3], images[4], images[5]]} y={y2} />
      <Column images={[images[6], images[7], images[8]]} y={y3} />
      <Column images={[images[9], images[10], images[11]]} y={y4} />
    </div>
  );
};

type ColumnProps = {
  images: string[];
  y: MotionValue<number>;
};

const Column = ({ images, y }: ColumnProps) => {
  return (
    <motion.div
      className="relative -top-[45%] flex h-full w-1/4 min-w-[250px] flex-col gap-[2vw] first:top-[-45%] [&:nth-child(2)]:top-[-95%] [&:nth-child(3)]:top-[-45%] [&:nth-child(4)]:top-[-75%]"
      style={{ y }}
    >
      {images.map((src, i) => (
        <div key={i} className="relative h-full w-full overflow-hidden">
          <img
            src={src}
            alt="image"
            className="pointer-events-none w-full h-full object-cover"
          />
        </div>
      ))}
    </motion.div>
  );
};

export { Skiper30 };
