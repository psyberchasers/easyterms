"use client";

import { AnimatePresence, motion, useSpring } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

const SPRING = {
  mass: 0.1,
  damping: 16,
  stiffness: 71,
};

interface TeamMember {
  name: string;
  image: string;
}

interface HoverMemberProps {
  teamMembers: TeamMember[];
  defaultName?: string;
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  hoverTextColor?: string;
  cursorColor?: string;
}

const teamMembers = [
  { name: "faffa", image: "/images/lummi/img1.png" },
  { name: "kaint", image: "/images/lummi/img4.png" },
  { name: "Att", image: "/images/lummi/img5.png" },
  { name: "Bamb", image: "/images/lummi/img2.png" },
  { name: "Sira", image: "/images/lummi/img6.png" },
  { name: "Koka", image: "/images/lummi/img7.png" },
  { name: "Pappi", image: "/images/lummi/img3.png" },
  { name: "Sawad", image: "/images/lummi/img8.png" },
  { name: "Khatam", image: "/images/lummi/img9.png" },
];

const ProfileImage = ({
  member,
  index,
  onHover,
}: {
  member: TeamMember;
  index: number;
  onHover: (index: number | null) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="profile-img relative cursor-pointer p-[2.5px] md:p-[5px]"
      style={{
        width: isHovered ? 120 : 60,
        height: isHovered ? 120 : 60,
      }}
      animate={{
        width: isHovered ? 120 : 60,
        height: isHovered ? 120 : 60,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onHoverStart={() => {
        setIsHovered(true);
        onHover(index);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        onHover(null);
      }}
    >
      <img
        src={member.image}
        alt={member.name}
        className="h-full w-full rounded-lg object-cover"
      />
    </motion.div>
  );
};

const HoverMember = ({
  teamMembers,
  defaultName = "SKIPER-UI",
  className,
  backgroundColor = "#121212",
  textColor = "text-white",
  hoverTextColor = "text-red-500",
  cursorColor = "bg-red-500",
}: HoverMemberProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for cursor following
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const scale = useSpring(0, { mass: 0.1, damping: 10, stiffness: 150 });

  const letterVariants = {
    hidden: { y: "100%" },
    visible: { y: "0%" },
    exit: { y: "-100%" },
  };

  const letterVariantsDefault = {
    hidden: { y: "-100%" },
    visible: { y: "0%" },
    exit: { y: "0%" },
  };

  // Calculate delay from center for letter animations
  const getCenterDelay = (index: number, totalLength: number) => {
    const centerIndex = Math.floor(totalLength / 2);
    const distanceFromCenter = Math.abs(index - centerIndex);
    return distanceFromCenter * 0.055;
  };

  const [idDomLoaded, setIdDomLoaded] = useState(false);

  useEffect(() => {
    setIdDomLoaded(true);
  }, []);

  if (!idDomLoaded) {
    return (
      <div className="h-screen w-screen" style={{ backgroundColor }}></div>
    );
  }

  return (
    <section
      className={`relative flex h-full w-full flex-1 flex-col items-center justify-center gap-10 overflow-hidden text-white ${className || ""}`}
      style={{ backgroundColor }}
    >
      {/* Profile Images */}
      <div
        ref={containerRef}
        className="z-99 absolute top-[10%] flex h-[120px] w-max max-w-[90%] flex-wrap items-center justify-center md:max-w-none"
        onPointerMove={(e) => {
          if (containerRef.current) {
            const bounds = containerRef.current.getBoundingClientRect();
            const offsetX = e.clientX - bounds.left; // Half of w-12 (48px)
            const offsetY = e.clientY - bounds.top; // Half of h-12 (48px)
            x.set(offsetX);
            y.set(offsetY);
          }
        }}
        onPointerEnter={() => scale.set(1)}
        onPointerLeave={() => scale.set(0)}
      >
        {teamMembers.map((member, index) => (
          <ProfileImage
            key={member.name}
            member={member}
            index={index}
            onHover={setHoveredIndex}
          />
        ))}

        {/* Cursor follower */}
        <motion.div
          style={{ x, y, scale, transformOrigin: "left top" }}
          className={`size-30 pointer-events-none absolute left-0 top-0 z-10 flex items-center justify-center rounded-full ${cursorColor}`}
        >
          <RightArrow className="h-5 w-5" />
        </motion.div>
      </div>

      {/* Profile Names */}
      <div className="relative h-[22vw] w-full overflow-hidden">
        {/* Default Name */}
        <AnimatePresence>
          {hoveredIndex === null && (
            <motion.div
              key="default"
              className="absolute w-full text-center"
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            >
              <h1
                className={`font-thunder text-foreground select-none whitespace-nowrap text-[28vw] uppercase leading-none ${textColor}`}
              >
                {Array.from(defaultName).map((letter, index) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    variants={letterVariantsDefault}
                    transition={{
                      duration: 0.8,
                      ease: [0.19, 1, 0.22, 1],
                      delay: getCenterDelay(index, defaultName.length),
                    }}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </motion.span>
                ))}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team Member Names */}
        {teamMembers.map((member, index) => (
          <AnimatePresence key={member.name}>
            {hoveredIndex === index && (
              <motion.div
                className="absolute w-full text-center"
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              >
                <h1
                  className={`font-thunder select-none text-[28vw] uppercase leading-none ${hoverTextColor}`}
                >
                  {Array.from(member.name).map((letter, letterIndex) => (
                    <motion.span
                      key={letterIndex}
                      className="inline-block"
                      variants={letterVariants}
                      transition={{
                        duration: 0.8,
                        ease: [0.19, 1, 0.22, 1],
                        delay: getCenterDelay(letterIndex, member.name.length),
                      }}
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </motion.span>
                  ))}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </section>
  );
};

const Skiper6 = () => {
  return (
    <HoverMember
      teamMembers={teamMembers}
      defaultName="SKIPER-UI"
      backgroundColor="#121212"
      textColor="text-white"
      hoverTextColor="text-red-500"
      cursorColor="bg-red-500"
    />
  );
};

export { HoverMember, Skiper6 };

const RightArrow = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M6.52182 2.75026L12.8858 9.11422L15.253 0.38299L6.52182 2.75026Z"
        fill="white"
      />
      <path
        d="M0.333095 12.3331L3.30294 15.3029L10.3402 6.56864L9.0674 5.29585L0.333095 12.3331Z"
        fill="white"
      />
    </svg>
  );
};

/**
 * Skiper 6 — React + Framer Motion Recreation
 * This implementation recreates the infinite scrolling grid interaction using React and Framer Motion.
 * Inspired by and adapted from https://opos.buzzworthystudio.com/directors
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 * Illustrations by https://www.lummi.ai/
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
