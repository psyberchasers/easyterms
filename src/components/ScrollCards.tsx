"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import {
  Mic, PenLine, Handshake, Globe,
  Clapperboard, SlidersHorizontal, RefreshCw, ScrollText,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger, CustomEase);

const cards = [
  { title: "Recording", icon: Mic, color: "from-red-950/80 to-red-900/40", border: "border-red-800/30" },
  { title: "Publishing", icon: PenLine, color: "from-amber-950/80 to-amber-900/40", border: "border-amber-800/30" },
  { title: "Management", icon: Handshake, color: "from-yellow-950/80 to-yellow-900/40", border: "border-yellow-800/30" },
  { title: "Distribution", icon: Globe, color: "from-emerald-950/80 to-emerald-900/40", border: "border-emerald-800/30" },
  { title: "Sync", icon: Clapperboard, color: "from-purple-950/80 to-purple-900/40", border: "border-purple-800/30" },
];

export default function ScrollCards() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const pinHeight = root.querySelector<HTMLElement>(".scroll-cards__pin-height");
    const container = root.querySelector<HTMLElement>(".scroll-cards__container");
    const cardEls = root.querySelectorAll<HTMLElement>(".scroll-cards__card");

    if (!pinHeight || !container || cardEls.length === 0) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pinHeight,
        start: "top top",
        end: "bottom bottom",
        pin: container,
        pinSpacing: false,
        scrub: true,
      });

      gsap.set(cardEls, {
        yPercent: 50,
        y: 0.5 * window.innerHeight,
      });

      const customEase = CustomEase.create(
        "cardSpread",
        "M0,0 C0,0 0.098,0.613 0.5,0.5 0.899,0.386 1,1 1,1"
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      tl.to(
        cardEls,
        {
          yPercent: -50,
          y: -0.5 * window.innerHeight,
          duration: 1,
          stagger: 0.12,
          ease: customEase,
        },
        "step"
      );

      tl.to(
        cardEls,
        {
          rotation: () => (Math.random() - 0.5) * 20,
          stagger: 0.12,
          duration: 0.5,
          ease: "power3.out",
        },
        "step"
      );

      tl.to(
        cardEls,
        {
          rotation: 0,
          stagger: 0.12,
          duration: 0.5,
          ease: "power3.in",
        },
        "step+=0.5"
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="scroll-cards">
      <div className="scroll-cards__pin-height" style={{ height: "500vh" }}>
        <div
          className="scroll-cards__container"
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: "clamp(48px, 6vw, 100px)",
            overflow: "hidden",
          }}
        >
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.title}
                className={`scroll-cards__card bg-gradient-to-br ${card.color} border ${card.border}`}
                style={{
                  width: "clamp(140px, 18vw, 280px)",
                  aspectRatio: "0.75",
                  borderRadius: "clamp(8px, 1vw, 16px)",
                  marginLeft: "clamp(-48px, -6vw, -80px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "clamp(12px, 1.2vw, 20px)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                <div className="flex items-center">
                  <IconComponent className="w-5 h-5 md:w-[1.8vw] md:h-[1.8vw] text-white/60" strokeWidth={1.5} />
                </div>
                <div className="flex justify-center">
                  <span className="text-white/20 font-bold leading-none" style={{ fontSize: "clamp(48px, 7vw, 120px)", fontFamily: "var(--font-circular)" }}>
                    {card.title[0]}
                  </span>
                </div>
                <p className="text-white text-[10px] md:text-[0.9vw] font-medium uppercase tracking-wider font-mono">
                  {card.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
