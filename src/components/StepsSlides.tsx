"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Upload, FileText, Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    title: "Upload",
    description:
      "Drop any contract — PDF, Word, or plain text. We support all standard formats used in the music industry. No account needed to start.",
    num: "(01)",
    image: "/steps-medias/1.png",
    bg: "#f1f1f1",
    color: "#121212",
    icon: Upload,
  },
  {
    title: "Analyze",
    description:
      "Our AI reads every clause, identifies risks, translates legal jargon into plain English, and compares your terms against industry standards.",
    num: "(02)",
    image: "/steps-medias/2.png",
    bg: "#a855f7",
    color: "#fff",
    icon: FileText,
  },
  {
    title: "Act",
    description:
      "Get specific, actionable recommendations on what to negotiate, what to push back on, and the questions to ask before you sign anything.",
    num: "(03)",
    image: "/steps-medias/3.png",
    bg: "#121212",
    color: "#f1f1f1",
    icon: Check,
  },
];

export default function StepsSlides() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const slides = root.querySelectorAll<HTMLElement>(".steps-slide");

    const ctx = gsap.context(() => {
      slides.forEach((slide) => {
        const contentWrapper = slide.querySelector<HTMLElement>(".steps-slide__wrapper");
        const content = slide.querySelector<HTMLElement>(".steps-slide__content");

        if (!contentWrapper || !content) return;

        gsap.to(content, {
          rotationZ: (Math.random() - 0.5) * 10,
          scale: 0.7,
          rotationX: 40,
          ease: "power1.in",
          scrollTrigger: {
            pin: contentWrapper,
            trigger: slide,
            start: "top 0%",
            end: "+=" + window.innerHeight,
            scrub: true,
          },
        });

        gsap.to(content, {
          autoAlpha: 0,
          ease: "power1.in",
          scrollTrigger: {
            trigger: content,
            start: "top -80%",
            end: "+=" + 0.2 * window.innerHeight,
            scrub: true,
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="steps-slides" style={{ padding: "100vh 0", position: "relative", overflow: "hidden" }}>
      {steps.map((step) => {
        const IconComponent = step.icon;
        return (
          <div key={step.num} className="steps-slide" style={{ height: "100vh", boxShadow: "3px 3px 30px rgba(0,0,0,0.14)" }}>
            <div className="steps-slide__wrapper" style={{ width: "100%", height: "100%", perspective: "250vw" }}>
              <div
                className="steps-slide__content"
                style={{
                  position: "absolute",
                  inset: 0,
                  transformStyle: "preserve-3d",
                  transformOrigin: "50% 10%",
                  padding: "25px 50px 50px 25px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: step.bg,
                  color: step.color,
                }}
              >
                {/* Top row: title + icon */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p
                    style={{
                      fontFamily: '"Raleway", sans-serif',
                      fontWeight: 800,
                      fontSize: "clamp(40px, 10.5vw, 180px)",
                      lineHeight: 0.9,
                      letterSpacing: "-0.06em",
                    }}
                  >
                    {step.title}
                  </p>
                  <IconComponent
                    style={{ width: "5.7vw", height: "5.7vw", minWidth: 40, minHeight: 40 }}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Bottom row: text + number + image */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 25 }}>
                  <p
                    style={{
                      width: "32vw",
                      fontFamily: '"Raleway", sans-serif',
                      fontWeight: 500,
                      fontSize: "clamp(14px, 1.6vw, 28px)",
                      lineHeight: 1.1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {step.description}
                  </p>
                  <div style={{ display: "flex", gap: 25, alignItems: "flex-end" }}>
                    <p
                      className="steps-slide__num"
                      style={{
                        fontFamily: '"Raleway", sans-serif',
                        fontWeight: 500,
                        fontSize: "clamp(40px, 10.5vw, 180px)",
                        lineHeight: 0.9,
                        letterSpacing: "-0.06em",
                      }}
                    >
                      {step.num}
                    </p>
                    <img
                      src={step.image}
                      alt={step.title}
                      style={{
                        width: "25vw",
                        borderRadius: "0.5vw",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style jsx global>{`
        @media (max-aspect-ratio: 1/1) {
          .steps-slide__content {
            padding: 15px !important;
            justify-content: initial !important;
          }
          .steps-slide__num {
            display: none;
          }
          .steps-slide .steps-slide__content > div:last-child {
            margin: 15px 0 0;
            flex-direction: column;
            gap: 15px;
          }
          .steps-slide .steps-slide__content > div:last-child p {
            order: 2;
            font-size: 18px !important;
            width: 100% !important;
          }
          .steps-slide .steps-slide__content > div:last-child img {
            width: 100% !important;
            aspect-ratio: 1;
            object-fit: cover;
          }
        }
      `}</style>
    </div>
  );
}
