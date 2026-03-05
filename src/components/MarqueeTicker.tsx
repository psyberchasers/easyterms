"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_TEXT = "\u00A0Analyze your contract now\u00A0";
const REPEAT_COUNT = 5;

const STATS = [
  "50K+ Contracts Analyzed",
  "98% Risk Detection",
  "30 Second Analysis",
  "Bank-Level Encryption",
];

function MarqueeRow() {
  return (
    <>
      {Array.from({ length: REPEAT_COUNT }).map((_, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span>{MARQUEE_TEXT}</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "5.5vw",
              height: "5.5vw",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: "block",
                width: "1.8vw",
                height: "1.8vw",
                borderRadius: "50%",
                backgroundColor: "#F1F1F1",
              }}
            />
          </span>
        </span>
      ))}
    </>
  );
}

export default function MarqueeTicker() {
  const pinHeightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentence1Ref = useRef<HTMLParagraphElement>(null);
  const sentence2Ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const pinHeight = pinHeightRef.current;
      const container = containerRef.current;
      const sentence1 = sentence1Ref.current;
      const sentence2 = sentence2Ref.current;

      if (!pinHeight || !container || !sentence1 || !sentence2) return;

      ScrollTrigger.create({
        trigger: pinHeight,
        start: "top top",
        end: "bottom bottom",
        pin: container,
        pinSpacing: false,
      });

      const startMarquee = () => {
        gsap.to(sentence1, {
          x: -sentence1.clientWidth / 2,
          ease: "none",
          duration: 10,
          repeat: -1,
        });

        gsap.from(sentence2, {
          x: -sentence2.clientWidth / 2,
          ease: "none",
          duration: 10,
          repeat: -1,
        });
      };

      if (typeof document !== "undefined" && document.fonts) {
        document.fonts.ready.then(startMarquee);
      } else {
        startMarquee();
      }

      gsap.to([sentence1, sentence2], {
        yPercent: "-=100",
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: pinHeight,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
        },
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .mwg_effect024 .pin-height {
          height: 200vh;
        }

        .mwg_effect024 .container {
          position: relative;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #121212;
          color: #f1f1f1;
        }

        .mwg_effect024 .sentences {
          position: relative;
          font: 500 normal 10vw/1.2 "Inter", sans-serif;
          letter-spacing: -0.06em;
        }

        .mwg_effect024 .sentence {
          overflow: hidden;
        }

        .mwg_effect024 .sentence p {
          display: flex;
          white-space: nowrap;
          width: max-content;
          will-change: transform;
        }

        .mwg_effect024 .sentence2 {
          position: absolute;
          top: 0;
          left: 0;
        }

        .mwg_effect024 .sentence2 p {
          transform: translate(0, 100%);
        }

        .mwg_effect024 .texts {
          display: flex;
          justify-content: space-between;
          margin: 1vw 0 0;
          padding: 2vw 2vw 0;
          border-top: 1px dashed rgb(72, 72, 72);
          font: 500 normal 0.9vw / normal "IBM Plex Mono", monospace;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .mwg_effect024 .sentences {
            font-size: 70px;
          }

          .mwg_effect024 .texts {
            font-size: 8px;
            padding: 15px;
            margin: 15px 0 0;
          }

          .mwg_effect024 .sentence p span span:last-child {
            width: 30px !important;
            height: 30px !important;
          }

          .mwg_effect024 .sentence p span span:last-child span {
            width: 12px !important;
            height: 12px !important;
          }
        }
      `}</style>

      <section className="mwg_effect024">
        <div className="pin-height" ref={pinHeightRef}>
          <div className="container" ref={containerRef}>
            <div className="sentences">
              <div className="sentence sentence1">
                <p ref={sentence1Ref}>
                  <MarqueeRow />
                </p>
              </div>
              <div className="sentence sentence2">
                <p ref={sentence2Ref}>
                  <MarqueeRow />
                </p>
              </div>
            </div>
            <div className="texts">
              {STATS.map((stat) => (
                <p key={stat}>{stat}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
