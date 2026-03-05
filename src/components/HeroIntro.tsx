"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function wrapWordsInSpan(element: HTMLElement) {
  const text = element.textContent || "";
  element.innerHTML = text
    .split(" ")
    .map((word) => `<span class="mwg022-word"><span>${word}</span></span>`)
    .join(" ");
}

export default function HeroIntro() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const pinHeight = root.querySelector<HTMLElement>(".mwg022-pin-height");
    const container = root.querySelector<HTMLElement>(".mwg022-container");
    const paragraphs = root.querySelectorAll<HTMLElement>(".mwg022-paragraph");

    if (!pinHeight || !container || paragraphs.length === 0) return;

    paragraphs.forEach((p) => wrapWordsInSpan(p));

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pinHeight,
        start: "top top",
        end: "bottom bottom",
        pin: container,
        pinSpacing: false,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinHeight,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      paragraphs.forEach((paragraph, index) => {
        if (paragraphs[index + 1]) {
          tl.to(paragraph.querySelectorAll(".mwg022-word span"), {
            y: "100%",
            duration: 1,
            stagger: 0.2,
            ease: "power4.in",
          });
          tl.to(
            paragraphs[index + 1].querySelectorAll(".mwg022-word span"),
            {
              y: "0%",
              duration: 1,
              delay: 1,
              stagger: 0.2,
              ease: "power4.out",
            },
            "<"
          );
        }
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div ref={rootRef} className="mwg022-root">
        <div className="mwg022-pin-height" style={{ height: "400vh" }}>
          <div className="mwg022-container" style={{ height: "100vh" }}>
            <div className="mwg022-top">
              <p>
                EasyTerms®
                <br />
                don't sign what you don't understand
              </p>
              <span className="mwg022-badge">ET</span>
            </div>
            <div className="mwg022-paragraphs">
              <p className="mwg022-paragraph">
                Upload your music contract and get instant clarity on every clause, every risk, and every opportunity — in under 30 seconds
              </p>
              <p className="mwg022-paragraph">
                Most musicians sign their first contract without understanding a single clause. Legal jargon and one-sided terms cost creators millions every year
              </p>
              <p className="mwg022-paragraph">
                AI-powered analysis that breaks down complex legal language into plain English, flags hidden risks, and gives you real negotiation leverage
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .mwg022-root {
          background: #121212;
          color: #f1f1f1;
        }
        .mwg022-container {
          display: flex;
          flex-direction: column;
        }
        .mwg022-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5vw 2.5vw;
          border-bottom: 1px dashed rgb(73, 73, 73);
        }
        .mwg022-top p {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 6vw;
          line-height: 0.9;
          letter-spacing: -0.05em;
        }
        .mwg022-badge {
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 4.6vw;
          line-height: 0.9;
          letter-spacing: -0.05em;
          display: grid;
          place-items: center;
          width: 10vw;
          height: 10vw;
          flex-shrink: 0;
          background: #CDFA6A;
          border-radius: 0.3em;
          color: #184739;
        }
        .mwg022-paragraphs {
          display: flex;
          align-items: center;
          padding: 5vw 2.5vw;
          column-gap: 2.5vw;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 2.3vw;
          line-height: 0.9;
          letter-spacing: -0.03em;
        }
        .mwg022-word {
          position: relative;
          overflow: hidden;
          display: inline-block;
          margin: -0.14em 0;
        }
        .mwg022-word span {
          display: block;
          padding: 0.14em 0;
        }
        .mwg022-paragraph:not(:first-child) .mwg022-word span {
          transform: translate(0, 100%);
        }

        @media (max-width: 768px) {
          .mwg022-top {
            padding: 30px 15px;
          }
          .mwg022-top p {
            font-size: 27px;
          }
          .mwg022-badge {
            font-size: 20px;
            width: 60px;
            height: 60px;
          }
          .mwg022-paragraphs {
            flex-direction: column;
            row-gap: 30px;
            font-size: 27px;
            padding: 30px 15px;
          }
        }
      `}</style>
    </>
  );
}
