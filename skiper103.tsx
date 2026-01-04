"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

const Skiper103 = () => {
  const items = [
    {
      icon: <Icon1 />,
      title: "Type Shit",
      description:
        "Fast, accurate typing with real-time validation and helpful hints.",
    },
    {
      icon: <Icon2 />,
      title: "Star Great",
      description:
        "Mark favorites and rate items with smooth micro-interactions.",
    },
    {
      icon: <Icon3 />,
      title: "Schedule",
      description:
        "Plan tasks with timelines, reminders, and conflict detection.",
    },
    {
      icon: <Icon4 />,
      title: "Buy Stuff",
      description:
        "Streamlined checkout with secure payments and transparent pricing.",
    },
    {
      icon: <Icon5 />,
      title: "Triangle Warning",
      description:
        "Surface critical alerts with accessible, non-intrusive messaging.",
    },
    {
      icon: <Icon6 />,
      title: "Account bal",
      description:
        "Track balances, recent activity, and spending insights at a glance.",
    },
  ];

  const [activeItem, setActiveItem] = useState<number | null>(2);

  return (
    <div
      onClick={() => setActiveItem(null)}
      className="flex size-full select-none flex-col items-center justify-center"
    >
      <div className="-mt-36 mb-36 grid content-start justify-items-center gap-6 text-center">
        <span className="after:to-foreground relative max-w-[14ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:content-['']">
          Click on Items to expand & collapse
        </span>
      </div>
      <ul className="h-30 w-[300px]">
        {items.map((item, index) => (
          <motion.li
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (index == activeItem) {
                setActiveItem(null);
                return;
              }
              setActiveItem(index);
            }}
            animate={{
              marginBlock: activeItem === index ? "10px" : "0px",
              height: activeItem == index ? "93px" : "45px",

              borderTopLeftRadius:
                index === 0 ||
                activeItem === index ||
                (activeItem !== null && index === activeItem + 1)
                  ? "20px"
                  : "0px",
              borderTopRightRadius:
                index === 0 ||
                activeItem === index ||
                (activeItem !== null && index === activeItem + 1)
                  ? "20px"
                  : "0px",
              borderBottomRightRadius:
                index === items.length - 1 ||
                activeItem === index ||
                (activeItem !== null && index === activeItem - 1)
                  ? "20px"
                  : "0px",
              borderBottomLeftRadius:
                index === items.length - 1 ||
                activeItem === index ||
                (activeItem !== null && index === activeItem - 1)
                  ? "20px"
                  : "0px",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="bg-background hover:bg-background/60 relative cursor-pointer gap-2 overflow-hidden px-2"
            key={index}
          >
            <div className="flex h-fit items-center gap-2 pl-3 pt-2.5">
              <div className="scale-85">{item.icon}</div>
              <span className="text-sm tracking-tight opacity-75">
                {item.title}
              </span>

              <ChevronDown
                className={cn(
                  "absolute right-4 size-4 transition-all ease-in-out",
                  activeItem == index && "rotate-180",
                )}
              />
            </div>

            <AnimatePresence>
              {activeItem == index && (
                <motion.p
                  initial={{ opacity: 0, filter: "blur(2px)" }}
                  animate={{ opacity: 0.6, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(2px)" }}
                  className="px-3 py-2 text-sm opacity-60"
                >
                  {item.description}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
      <p className="text-muted-foreground absolute bottom-4 text-xs">
        Inspired by{" "}
        <a
          href="https://x.com/dev_ya"
          target="_blank"
          className="hover:text-foreground underline"
        >
          Yanis
        </a>{" "}
        Icons from{" "}
        <a
          href="https://nucleoapp.com/svg-glass-icons"
          target="_blank"
          className="hover:text-foreground underline"
        >
          Nucleo Icons
        </a>
      </p>
    </div>
  );
};

export { Skiper103 };

// Icons from the https://nucleoapp.com/svg-glass-icons

const Icon1 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <title>book-open</title>
    <g fill="none">
      <path
        fill="url(#a)"
        d="M19.8 7c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .874.874C23 8.52 23 9.08 23 10.2v4.4c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C19.96 21 18.84 21 16.6 21c-.6 0-1.252-.075-1.845.031-.404.072-.725.283-1.061.506-.258.172-.516.393-.821.448-.087.015-.177.015-.357.015h-1.032c-.18 0-.27 0-.357-.015-.305-.055-.563-.276-.82-.448-.337-.223-.658-.434-1.062-.506C8.652 20.925 8 21 7.4 21c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C1 17.96 1 16.84 1 14.6v-4.4c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874C2.52 7 3.08 7 4.2 7h15.6Z"
        data-glass="origin"
        mask="url(#b)"
      />
      <path
        fill="url(#a)"
        d="M19.8 7c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .874.874C23 8.52 23 9.08 23 10.2v4.4c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C19.96 21 18.84 21 16.6 21c-.6 0-1.252-.075-1.845.031-.404.072-.725.283-1.061.506-.258.172-.516.393-.821.448-.087.015-.177.015-.357.015h-1.032c-.18 0-.27 0-.357-.015-.305-.055-.563-.276-.82-.448-.337-.223-.658-.434-1.062-.506C8.652 20.925 8 21 7.4 21c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C1 17.96 1 16.84 1 14.6v-4.4c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874C2.52 7 3.08 7 4.2 7h15.6Z"
        clipPath="url(#d)"
        data-glass="clone"
        filter="url(#c)"
      />
      <path
        fill="url(#e)"
        d="M17.106 2.865c1.331-.296 1.997-.443 2.52-.271a2 2 0 0 1 1.093.876C21 3.943 21 4.625 21 5.99v8.443c0 .916 0 1.374-.162 1.752a2.001 2.001 0 0 1-.669.833c-.334.24-.78.34-1.675.539l-6.147 1.366a2.09 2.09 0 0 1-.26.049 1 1 0 0 1-.174 0 2.09 2.09 0 0 1-.26-.05l-6.147-1.365c-.894-.199-1.341-.298-1.675-.539a2 2 0 0 1-.669-.833C3 15.807 3 15.349 3 14.433V5.99c0-1.364 0-2.046.281-2.519a2 2 0 0 1 1.093-.876c.523-.172 1.189-.025 2.52.271l4.759 1.058c.13.029.194.043.26.049a1 1 0 0 0 .174 0c.066-.006.13-.02.26-.05l4.759-1.057Z"
        data-glass="blur"
      />
      <path
        fill="url(#f)"
        d="M20.25 5.99c0-.696 0-1.17-.032-1.53-.031-.352-.087-.51-.144-.606a1.252 1.252 0 0 0-.683-.548c-.106-.035-.272-.054-.623-.008-.358.047-.82.149-1.5.3L12.51 4.655c-.111.025-.231.053-.357.064a1.76 1.76 0 0 1-.306 0c-.126-.011-.246-.04-.357-.064L6.731 3.598c-.679-.151-1.14-.253-1.499-.3-.35-.046-.517-.027-.623.008-.286.094-.529.29-.683.548-.057.096-.113.254-.144.607-.031.36-.032.833-.032 1.528v8.445c0 .468 0 .78.019 1.022.017.233.047.35.083.433.089.208.234.389.418.521.073.053.18.108.404.175.233.07.537.139.995.24l6.146 1.366.135.029.029.005a.238.238 0 0 0 .043 0l.028-.005.135-.03 6.146-1.365c.458-.101.762-.17.995-.24.223-.067.331-.122.404-.175.184-.132.329-.313.418-.521.036-.083.066-.2.083-.433.018-.242.019-.554.019-1.022V5.989Zm.75 8.444-.003.606c-.008.533-.038.861-.16 1.145l-.057.123a2 2 0 0 1-.611.71l-.13.085c-.322.182-.763.28-1.545.454l-6.147 1.366a2.08 2.08 0 0 1-.26.049 1.009 1.009 0 0 1-.087.004l-.087-.004a1.013 1.013 0 0 1-.106-.016l-.154-.033-6.147-1.366c-.783-.174-1.223-.272-1.544-.454l-.131-.084a2.003 2.003 0 0 1-.669-.834c-.121-.284-.151-.612-.16-1.145L3 14.434V5.989c0-1.279 0-1.958.231-2.428l.05-.09c.216-.363.54-.648.925-.814l.168-.063c.523-.172 1.189-.025 2.52.271l4.76 1.058c.129.029.194.043.26.049a1 1 0 0 0 .173 0c.065-.006.13-.02.26-.05l4.758-1.057c1.332-.296 1.998-.443 2.521-.271.458.15.846.462 1.093.877C21 3.943 21 4.625 21 5.989v8.445Z"
      />
      <defs>
        <linearGradient
          id="a"
          x1={12}
          x2={12}
          y1={7}
          y2={22}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="e"
          x1={21}
          x2={3}
          y1={10.5}
          y2={10.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E3E3E5" stopOpacity={0.6} />
          <stop offset={1} stopColor="#BBBBC0" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient
          id="f"
          x1={12}
          x2={12}
          y1={2.52}
          y2={12.05}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id="d">
          <path
            fill="url(#e)"
            d="M17.106 2.865c1.331-.296 1.997-.443 2.52-.271a2 2 0 0 1 1.093.876C21 3.943 21 4.625 21 5.99v8.443c0 .916 0 1.374-.162 1.752a2.001 2.001 0 0 1-.669.833c-.334.24-.78.34-1.675.539l-6.147 1.366a2.09 2.09 0 0 1-.26.049 1 1 0 0 1-.174 0 2.09 2.09 0 0 1-.26-.05l-6.147-1.365c-.894-.199-1.341-.298-1.675-.539a2 2 0 0 1-.669-.833C3 15.807 3 15.349 3 14.433V5.99c0-1.364 0-2.046.281-2.519a2 2 0 0 1 1.093-.876c.523-.172 1.189-.025 2.52.271l4.759 1.058c.13.029.194.043.26.049a1 1 0 0 0 .174 0c.066-.006.13-.02.26-.05l4.759-1.057Z"
          />
        </clipPath>
        <filter
          id="c"
          width="400%"
          height="400%"
          x="-100%"
          y="-100%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feGaussianBlur
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            in="SourceGraphic"
            result="blur"
            stdDeviation={2}
          />
        </filter>
        <mask id="b">
          <rect width="100%" height="100%" fill="#FFF" />
          <path
            fill="#000"
            d="M17.106 2.865c1.331-.296 1.997-.443 2.52-.271a2 2 0 0 1 1.093.876C21 3.943 21 4.625 21 5.99v8.443c0 .916 0 1.374-.162 1.752a2.001 2.001 0 0 1-.669.833c-.334.24-.78.34-1.675.539l-6.147 1.366a2.09 2.09 0 0 1-.26.049 1 1 0 0 1-.174 0 2.09 2.09 0 0 1-.26-.05l-6.147-1.365c-.894-.199-1.341-.298-1.675-.539a2 2 0 0 1-.669-.833C3 15.807 3 15.349 3 14.433V5.99c0-1.364 0-2.046.281-2.519a2 2 0 0 1 1.093-.876c.523-.172 1.189-.025 2.52.271l4.759 1.058c.13.029.194.043.26.049a1 1 0 0 0 .174 0c.066-.006.13-.02.26-.05l4.759-1.057Z"
          />
        </mask>
      </defs>
    </g>
  </svg>
);

const Icon2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <title>award</title>
    <g fill="none">
      <path
        fill="url(#a)"
        d="M7 16c3.904-1.37 6.098-1.396 10 0v6.124a1 1 0 0 1-1.557.83L12 20.642l-3.442 2.312A1 1 0 0 1 7 22.124V16Zm4.112-12.425a.973.973 0 0 1 1.776 0l1.315 2.783 2.949.447c.81.123 1.135 1.158.55 1.754l-2.136 2.172.504 3.064c.138.841-.711 1.482-1.437 1.084L12 13.435l-2.633 1.444c-.725.398-1.575-.243-1.437-1.084l.504-3.064-2.136-2.172c-.585-.596-.26-1.631.55-1.754l2.948-.447 1.316-2.783Z"
        data-glass="origin"
        mask="url(#b)"
      />
      <path
        fill="url(#a)"
        d="M7 16c3.904-1.37 6.098-1.396 10 0v6.124a1 1 0 0 1-1.557.83L12 20.642l-3.442 2.312A1 1 0 0 1 7 22.124V16Zm4.112-12.425a.973.973 0 0 1 1.776 0l1.315 2.783 2.949.447c.81.123 1.135 1.158.55 1.754l-2.136 2.172.504 3.064c.138.841-.711 1.482-1.437 1.084L12 13.435l-2.633 1.444c-.725.398-1.575-.243-1.437-1.084l.504-3.064-2.136-2.172c-.585-.596-.26-1.631.55-1.754l2.948-.447 1.316-2.783Z"
        clipPath="url(#d)"
        data-glass="clone"
        filter="url(#c)"
      />
      <path
        fill="url(#e)"
        d="M12 1a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z"
        data-glass="blur"
      />
      <path
        fill="url(#f)"
        d="M12 1a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm0 .75a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Z"
      />
      <defs>
        <linearGradient
          id="a"
          x1={12}
          x2={12}
          y1={-0.5}
          y2={23.126}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="e"
          x1={12}
          x2={12}
          y1={1}
          y2={18}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E3E3E5" stopOpacity={0.6} />
          <stop offset={1} stopColor="#BBBBC0" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient
          id="f"
          x1={12}
          x2={12}
          y1={1}
          y2={10.845}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id="d">
          <path
            fill="url(#e)"
            d="M12 1a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z"
          />
        </clipPath>
        <filter
          id="c"
          width="400%"
          height="400%"
          x="-100%"
          y="-100%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feGaussianBlur
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            in="SourceGraphic"
            result="blur"
            stdDeviation={2}
          />
        </filter>
        <mask id="b">
          <rect width="100%" height="100%" fill="#FFF" />
          <path fill="#000" d="M12 1a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z" />
        </mask>
      </defs>
    </g>
  </svg>
);

const Icon3 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <title>calendar</title>
    <g fill="none">
      <path
        fill="url(#a)"
        d="M6.478 15.495a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5.522 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5.523 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM17 1a1 1 0 0 1 1 1v1.04c.785.048 1.341.154 1.816.396a4.001 4.001 0 0 1 1.748 1.748C22 6.039 22 7.16 22 9.4V11h-3.157a2 2 0 1 1-3.32 1.5c0-.598.264-1.133.68-1.5H13.32c.417.367.681.902.681 1.5a2 2 0 1 1-3.32-1.5H7.798a2 2 0 1 1-2.639 0H2V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C4.659 3.194 5.215 3.088 6 3.04V2a1 1 0 0 1 2 0v1.001L8.4 3H11V2a1 1 0 1 1 2 0v1h2.6l.4.001V2a1 1 0 0 1 1-1Z"
        data-glass="origin"
        mask="url(#b)"
      />
      <path
        fill="url(#a)"
        d="M6.478 15.495a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5.522 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5.523 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM17 1a1 1 0 0 1 1 1v1.04c.785.048 1.341.154 1.816.396a4.001 4.001 0 0 1 1.748 1.748C22 6.039 22 7.16 22 9.4V11h-3.157a2 2 0 1 1-3.32 1.5c0-.598.264-1.133.68-1.5H13.32c.417.367.681.902.681 1.5a2 2 0 1 1-3.32-1.5H7.798a2 2 0 1 1-2.639 0H2V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C4.659 3.194 5.215 3.088 6 3.04V2a1 1 0 0 1 2 0v1.001L8.4 3H11V2a1 1 0 1 1 2 0v1h2.6l.4.001V2a1 1 0 0 1 1-1Z"
        clipPath="url(#d)"
        data-glass="clone"
        filter="url(#c)"
      />
      <path
        fill="url(#e)"
        d="M15.6 7c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C22 10.039 22 11.16 22 13.4v2.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C18.961 22 17.84 22 15.6 22H8.4c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C2 18.961 2 17.84 2 15.6v-2.2c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C5.039 7 6.16 7 8.4 7h7.2Zm-9.1 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-11-5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
        data-glass="blur"
      />
      <path
        fill="url(#f)"
        d="M15.6 7c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C22 10.039 22 11.16 22 13.4v2.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C18.961 22 17.84 22 15.6 22H8.4c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C2 18.961 2 17.84 2 15.6v-2.2c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C5.039 7 6.16 7 8.4 7h7.2Zm-7.2.75c-1.132 0-1.937 0-2.566.052-.62.05-1.005.147-1.31.302a3.25 3.25 0 0 0-1.42 1.42c-.155.305-.252.69-.302 1.31-.052.63-.052 1.434-.052 2.566v2.2c0 1.132 0 1.936.052 2.566.05.62.147 1.005.302 1.31.311.611.809 1.109 1.42 1.42.305.155.69.252 1.31.302.63.052 1.434.052 2.566.052h7.2c1.132 0 1.936 0 2.566-.052.62-.05 1.005-.147 1.31-.302a3.254 3.254 0 0 0 1.42-1.42c.155-.305.252-.69.302-1.31.052-.63.052-1.434.052-2.566v-2.2c0-1.132 0-1.937-.052-2.566-.05-.62-.147-1.005-.303-1.31a3.25 3.25 0 0 0-1.42-1.42c-.304-.155-.688-.252-1.309-.302-.63-.052-1.434-.052-2.566-.052H8.4Z"
      />
      <defs>
        <linearGradient
          id="a"
          x1={12}
          x2={12}
          y1={-2}
          y2={19.495}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="e"
          x1={12}
          x2={12}
          y1={7}
          y2={22}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E3E3E5" stopOpacity={0.6} />
          <stop offset={1} stopColor="#BBBBC0" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient
          id="f"
          x1={12}
          x2={12}
          y1={7}
          y2={15.687}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id="d">
          <path
            fill="url(#e)"
            d="M15.6 7c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C22 10.039 22 11.16 22 13.4v2.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C18.961 22 17.84 22 15.6 22H8.4c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C2 18.961 2 17.84 2 15.6v-2.2c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C5.039 7 6.16 7 8.4 7h7.2Zm-9.1 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-11-5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
          />
        </clipPath>
        <filter
          id="c"
          width="400%"
          height="400%"
          x="-100%"
          y="-100%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feGaussianBlur
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            in="SourceGraphic"
            result="blur"
            stdDeviation={2}
          />
        </filter>
        <mask id="b">
          <rect width="100%" height="100%" fill="#FFF" />
          <path
            fill="#000"
            d="M15.6 7c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C22 10.039 22 11.16 22 13.4v2.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C18.961 22 17.84 22 15.6 22H8.4c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C2 18.961 2 17.84 2 15.6v-2.2c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C5.039 7 6.16 7 8.4 7h7.2Zm-9.1 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-11-5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm5.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
          />
        </mask>
      </defs>
    </g>
  </svg>
);

const Icon4 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <title>cart</title>
    <g fill="none">
      <path
        fill="url(#a)"
        d="M17.9 4.879a3 3 0 0 1-.01 4.232l-2.769 2.768a3 3 0 0 1-4.242 0L8.132 9.132a3 3 0 0 1 .01-4.253L10.94 2.11a3 3 0 0 1 4.243.021L17.9 4.88Z"
        data-glass="origin"
        mask="url(#b)"
      />
      <path
        fill="url(#a)"
        d="M17.9 4.879a3 3 0 0 1-.01 4.232l-2.769 2.768a3 3 0 0 1-4.242 0L8.132 9.132a3 3 0 0 1 .01-4.253L10.94 2.11a3 3 0 0 1 4.243.021L17.9 4.88Z"
        clipPath="url(#d)"
        data-glass="clone"
        filter="url(#c)"
      />
      <path fill="url(#e)" d="M3 21a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" />
      <path fill="url(#f)" d="M17 21a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" />
      <path
        fill="url(#g)"
        d="M1.266 1a3 3 0 0 1 2.97 2.576L4.437 5h15.545a2 2 0 0 1 1.949 2.452l-1.47 6.332A4 4 0 0 1 16.54 17H7.602a4 4 0 0 1-3.96-3.435L2.58 6.142l-.002-.017-.324-2.267A1 1 0 0 0 1.265 3H1a1 1 0 0 1 0-2h.266Z"
        data-glass="blur"
      />
      <path
        fill="url(#h)"
        d="M19.983 5a2 2 0 0 1 1.948 2.452l-1.469 6.332A4.001 4.001 0 0 1 16.54 17H7.601a4.001 4.001 0 0 1-3.96-3.435L2.58 6.142A1.002 1.002 0 0 1 3.57 5h16.412Zm-16.466.756a.252.252 0 0 0-.136.079.253.253 0 0 0-.057.2l1.06 7.424a3.25 3.25 0 0 0 3.217 2.791h8.938a3.251 3.251 0 0 0 3.193-2.636L21.2 7.282a1.25 1.25 0 0 0-1.218-1.532H3.572l-.055.006Z"
      />
      <defs>
        <linearGradient
          id="a"
          x1={13.011}
          x2={13.011}
          y1={1.243}
          y2={12.757}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="e"
          x1={5}
          x2={5}
          y1={19}
          y2={23}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="f"
          x1={19}
          x2={19}
          y1={19}
          y2={23}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="g"
          x1={10.992}
          x2={10.992}
          y1={1}
          y2={17}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E3E3E5" stopOpacity={0.6} />
          <stop offset={1} stopColor="#BBBBC0" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient
          id="h"
          x1={14}
          x2={11.5}
          y1={5}
          y2={9.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id="d">
          <path
            fill="url(#g)"
            d="M1.266 1a3 3 0 0 1 2.97 2.576L4.437 5h15.545a2 2 0 0 1 1.949 2.452l-1.47 6.332A4 4 0 0 1 16.54 17H7.602a4 4 0 0 1-3.96-3.435L2.58 6.142l-.002-.017-.324-2.267A1 1 0 0 0 1.265 3H1a1 1 0 0 1 0-2h.266Z"
          />
        </clipPath>
        <filter
          id="c"
          width="400%"
          height="400%"
          x="-100%"
          y="-100%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feGaussianBlur
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            in="SourceGraphic"
            result="blur"
            stdDeviation={2}
          />
        </filter>
        <mask id="b">
          <rect width="100%" height="100%" fill="#FFF" />
          <path
            fill="#000"
            d="M1.266 1a3 3 0 0 1 2.97 2.576L4.437 5h15.545a2 2 0 0 1 1.949 2.452l-1.47 6.332A4 4 0 0 1 16.54 17H7.602a4 4 0 0 1-3.96-3.435L2.58 6.142l-.002-.017-.324-2.267A1 1 0 0 0 1.265 3H1a1 1 0 0 1 0-2h.266Z"
          />
        </mask>
      </defs>
    </g>
  </svg>
);

const Icon5 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <title>code-editor</title>
    <g fill="none">
      <path
        fill="url(#a)"
        d="M9.424 3.394c-.867.216-1.3.325-1.623.567a2 2 0 0 0-.645.826C7 5.16 7 5.605 7 6.498v11.004c0 .893 0 1.34.156 1.71.138.329.36.614.645.827.322.242.756.35 1.623.567L11 21H7.4c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C1 17.961 1 16.84 1 14.6V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C4.039 3 5.16 3 7.4 3H11l-1.576.394ZM15 15.5a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 1 0-3h2Zm5-3.5a1.5 1.5 0 0 1 0 3h-5a1.5 1.5 0 0 1 0-3h5Zm-4-3.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 1 0-3h3Zm-5.847-2.992a1.5 1.5 0 0 1 0 2.984L10 8.5H9a1.5 1.5 0 1 1 0-3h1l.153.008Z"
        data-glass="origin"
        mask="url(#b)"
      />
      <path
        fill="url(#a)"
        d="M9.424 3.394c-.867.216-1.3.325-1.623.567a2 2 0 0 0-.645.826C7 5.16 7 5.605 7 6.498v11.004c0 .893 0 1.34.156 1.71.138.329.36.614.645.827.322.242.756.35 1.623.567L11 21H7.4c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C1 17.961 1 16.84 1 14.6V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C4.039 3 5.16 3 7.4 3H11l-1.576.394ZM15 15.5a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 1 0-3h2Zm5-3.5a1.5 1.5 0 0 1 0 3h-5a1.5 1.5 0 0 1 0-3h5Zm-4-3.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 1 0-3h3Zm-5.847-2.992a1.5 1.5 0 0 1 0 2.984L10 8.5H9a1.5 1.5 0 1 1 0-3h1l.153.008Z"
        clipPath="url(#d)"
        data-glass="clone"
        filter="url(#c)"
      />
      <path
        fill="url(#e)"
        d="M16.6 3c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C23 6.039 23 7.16 23 9.4v5.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C19.961 21 18.84 21 16.6 21h-5.2c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C5 17.961 5 16.84 5 14.6V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C8.039 3 9.16 3 11.4 3h5.2ZM13 16a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2Zm2-3.5a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5ZM13 9a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3ZM9 6a1 1 0 0 0 0 2h1a1 1 0 1 0 0-2H9Z"
        data-glass="blur"
      />
      <path
        fill="url(#f)"
        d="M16.6 3c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C23 6.039 23 7.16 23 9.4v5.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C19.961 21 18.84 21 16.6 21h-5.2c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C5 17.961 5 16.84 5 14.6V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C8.039 3 9.16 3 11.4 3h5.2Zm-5.2.75c-1.132 0-1.936 0-2.566.052-.62.05-1.005.147-1.31.302-.611.311-1.109.809-1.42 1.42-.155.305-.252.69-.302 1.31-.052.63-.052 1.434-.052 2.566v5.2c0 1.132 0 1.936.052 2.566.05.62.147 1.005.302 1.31.311.611.809 1.109 1.42 1.42.305.155.69.252 1.31.302.63.052 1.434.052 2.566.052h5.2c1.132 0 1.936 0 2.566-.052.62-.05 1.005-.147 1.31-.302a3.254 3.254 0 0 0 1.42-1.42c.155-.305.252-.69.302-1.31.052-.63.052-1.434.052-2.566V9.4c0-1.132 0-1.936-.052-2.566-.05-.62-.147-1.005-.302-1.31a3.254 3.254 0 0 0-1.42-1.42c-.305-.155-.69-.252-1.31-.302-.63-.052-1.434-.052-2.566-.052h-5.2Z"
      />
      <defs>
        <linearGradient
          id="a"
          x1={11.25}
          x2={11.25}
          y1={3}
          y2={21}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="e"
          x1={14}
          x2={14}
          y1={3}
          y2={21}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E3E3E5" stopOpacity={0.6} />
          <stop offset={1} stopColor="#BBBBC0" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient
          id="f"
          x1={14}
          x2={14}
          y1={3}
          y2={13.424}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id="d">
          <path
            fill="url(#e)"
            d="M16.6 3c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C23 6.039 23 7.16 23 9.4v5.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C19.961 21 18.84 21 16.6 21h-5.2c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C5 17.961 5 16.84 5 14.6V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C8.039 3 9.16 3 11.4 3h5.2ZM13 16a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2Zm2-3.5a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5ZM13 9a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3ZM9 6a1 1 0 0 0 0 2h1a1 1 0 1 0 0-2H9Z"
          />
        </clipPath>
        <filter
          id="c"
          width="400%"
          height="400%"
          x="-100%"
          y="-100%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feGaussianBlur
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            in="SourceGraphic"
            result="blur"
            stdDeviation={2}
          />
        </filter>
        <mask id="b">
          <rect width="100%" height="100%" fill="#FFF" />
          <path
            fill="#000"
            d="M16.6 3c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C23 6.039 23 7.16 23 9.4v5.2c0 2.24 0 3.36-.436 4.216a4.002 4.002 0 0 1-1.748 1.748C19.961 21 18.84 21 16.6 21h-5.2c-2.24 0-3.36 0-4.216-.436a4.001 4.001 0 0 1-1.748-1.748C5 17.961 5 16.84 5 14.6V9.4c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748C8.039 3 9.16 3 11.4 3h5.2ZM13 16a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2Zm2-3.5a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5ZM13 9a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3ZM9 6a1 1 0 0 0 0 2h1a1 1 0 1 0 0-2H9Z"
          />
        </mask>
      </defs>
    </g>
  </svg>
);

const Icon6 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} {...props}>
    <title>wallet-content</title>
    <g fill="none">
      <path
        fill="url(#a)"
        d="M14.41 1.932c1.924-.32 2.885-.481 3.635-.203a3 3 0 0 1 1.557 1.32C20 3.742 20 4.717 20 6.666v4.268c0 1.444 0 2.167-.263 2.753a3 3 0 0 1-1.076 1.27c-.535.355-1.247.474-2.672.711l-8.4 1.4c-1.923.321-2.884.481-3.634.203a3 3 0 0 1-1.557-1.32C2 15.258 2 14.283 2 12.334v-1.557c0-2.408 0-3.611.438-4.588a5 5 0 0 1 1.793-2.117c.891-.592 2.079-.79 4.454-1.186l5.726-.954Z"
        data-glass="origin"
        mask="url(#b)"
      />
      <path
        fill="url(#a)"
        d="M14.41 1.932c1.924-.32 2.885-.481 3.635-.203a3 3 0 0 1 1.557 1.32C20 3.742 20 4.717 20 6.666v4.268c0 1.444 0 2.167-.263 2.753a3 3 0 0 1-1.076 1.27c-.535.355-1.247.474-2.672.711l-8.4 1.4c-1.923.321-2.884.481-3.634.203a3 3 0 0 1-1.557-1.32C2 15.258 2 14.283 2 12.334v-1.557c0-2.408 0-3.611.438-4.588a5 5 0 0 1 1.793-2.117c.891-.592 2.079-.79 4.454-1.186l5.726-.954Z"
        clipPath="url(#d)"
        data-glass="clone"
        filter="url(#c)"
      />
      <path
        fill="url(#e)"
        d="M15.6 5c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C22 8.04 22 9.16 22 11.4v4.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C18.96 22 17.84 22 15.6 22H8.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C2 18.96 2 17.84 2 15.6v-4.2c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C5.04 5 6.16 5 8.4 5h7.2Z"
        data-glass="blur"
      />
      <path
        fill="url(#f)"
        d="M15.6 21.25V22H8.4v-.75h7.2Zm5.65-5.65v-4.2c0-1.132 0-1.937-.052-2.566-.05-.62-.147-1.005-.303-1.31a3.25 3.25 0 0 0-1.42-1.42c-.304-.155-.688-.252-1.309-.302-.63-.052-1.434-.052-2.566-.052H8.4c-1.132 0-1.937 0-2.566.052-.62.05-1.005.147-1.31.302a3.25 3.25 0 0 0-1.42 1.42c-.155.305-.252.69-.302 1.31-.052.63-.052 1.434-.052 2.566v4.2c0 1.132 0 1.937.052 2.566.05.62.147 1.005.302 1.31a3.25 3.25 0 0 0 1.42 1.42c.305.155.69.252 1.31.302.63.052 1.434.052 2.566.052V22l-1.484-.007c-1.192-.019-1.955-.089-2.568-.352l-.164-.076a4.002 4.002 0 0 1-1.594-1.473l-.154-.276C2 18.961 2 17.84 2 15.6v-4.2c0-2.24 0-3.36.436-4.216a4.001 4.001 0 0 1 1.748-1.748c.641-.327 1.432-.409 2.732-.43L8.4 5h7.2c2.24 0 3.36 0 4.216.436a4.001 4.001 0 0 1 1.748 1.748C22 8.039 22 9.16 22 11.4v4.2c0 2.24 0 3.36-.436 4.216l-.154.276a4.002 4.002 0 0 1-1.594 1.473l-.164.076C18.816 22 17.7 22 15.6 22v-.75c1.132 0 1.937 0 2.566-.052.62-.05 1.005-.147 1.31-.303a3.25 3.25 0 0 0 1.42-1.42c.155-.304.252-.688.302-1.309.052-.63.052-1.434.052-2.566Z"
      />
      <path
        fill="url(#g)"
        d="M22 10h-3.5a3.5 3.5 0 1 0 0 7H22a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1Z"
      />
      <defs>
        <linearGradient
          id="a"
          x1={11}
          x2={11}
          y1={1.586}
          y2={17.414}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <linearGradient
          id="e"
          x1={22}
          x2={2}
          y1={13.5}
          y2={13.5}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E3E3E5" stopOpacity={0.6} />
          <stop offset={1} stopColor="#BBBBC0" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient
          id="f"
          x1={12}
          x2={12}
          y1={5}
          y2={14.845}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="g"
          x1={19}
          x2={19}
          y1={10}
          y2={17}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#575757" />
          <stop offset={1} stopColor="#151515" />
        </linearGradient>
        <clipPath id="d">
          <path
            fill="url(#e)"
            d="M15.6 5c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C22 8.04 22 9.16 22 11.4v4.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C18.96 22 17.84 22 15.6 22H8.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C2 18.96 2 17.84 2 15.6v-4.2c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C5.04 5 6.16 5 8.4 5h7.2Z"
          />
        </clipPath>
        <filter
          id="c"
          width="400%"
          height="400%"
          x="-100%"
          y="-100%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feGaussianBlur
            width="100%"
            height="100%"
            x="0%"
            y="0%"
            in="SourceGraphic"
            result="blur"
            stdDeviation={2}
          />
        </filter>
        <mask id="b">
          <rect width="100%" height="100%" fill="#FFF" />
          <path
            fill="#000"
            d="M15.6 5c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C22 8.04 22 9.16 22 11.4v4.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C18.96 22 17.84 22 15.6 22H8.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C2 18.96 2 17.84 2 15.6v-4.2c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C5.04 5 6.16 5 8.4 5h7.2Z"
          />
        </mask>
      </defs>
    </g>
  </svg>
);
