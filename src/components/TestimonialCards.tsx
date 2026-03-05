"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Caught a perpetual rights clause I completely missed. Saved my entire catalog.",
    name: "Jordan",
    role: "R&B Artist",
    avatar: "/1.svg",
    color: "#F14A3A",
  },
  {
    quote: "I use EasyTerms before every meeting with my lawyer. Cut my legal fees in half.",
    name: "Priya",
    role: "Songwriter",
    avatar: "/2.svg",
    color: "#FB7350",
  },
  {
    quote: "The AI explained a 360 deal better than my manager did. Negotiated a merch carve-out.",
    name: "Marcus",
    role: "Hip-Hop Artist",
    avatar: "/3.svg",
    color: "#F79C42",
  },
  {
    quote: "Compared two label offers side by side. The better deal was instantly obvious.",
    name: "Aaliyah",
    role: "Pop Artist",
    avatar: "/4.svg",
    color: "#FFDF40",
  },
  {
    quote: "I run every contract through EasyTerms before presenting to my artists. Non-negotiable.",
    name: "David",
    role: "Artist Manager",
    avatar: "/1.svg",
    color: "#DEDA8D",
  },
  {
    quote: "Flagged a 10-year lock-in I almost signed. Got it negotiated down to 3 years.",
    name: "Suki",
    role: "Topliner",
    avatar: "/2.svg",
    color: "#71CFA3",
  },
  {
    quote: "Finally understand what I'm actually signing. Every musician needs this tool.",
    name: "Ella",
    role: "Indie Artist",
    avatar: "/3.svg",
    color: "#C4EF7A",
  },
  {
    quote: "Game-changer for independent artists who can't afford $400/hr music lawyers.",
    name: "Tom",
    role: "Producer",
    avatar: "/4.svg",
    color: "#BCEFFF",
  },
];

const zIndices = [3, 2, 7, 1, 4, 5, 8, 6];

export default function TestimonialCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentPortionRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const contents = contentRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!container || cards.length === 0) return;

    const cardsLength = cards.length;

    // Initial random offsets
    cards.forEach((card) => {
      gsap.set(card, {
        xPercent: (Math.random() - 0.5) * 10,
        yPercent: (Math.random() - 0.5) * 10,
        rotation: (Math.random() - 0.5) * 20,
      });
    });

    function resetPortion(index: number) {
      if (!cards[index]) return;
      gsap.to(cards[index], {
        xPercent: (Math.random() - 0.5) * 10,
        yPercent: (Math.random() - 0.5) * 10,
        rotation: (Math.random() - 0.5) * 20,
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.75)",
      });
    }

    function newPortion(i: number) {
      gsap.to(cards[i], {
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        duration: 0.8,
        scale: 1.1,
        ease: "elastic.out(1, 0.75)",
      });

      contents.forEach((content, index) => {
        if (index !== i) {
          gsap.to(content, {
            xPercent: 80 / (index - i),
            ease: "elastic.out(1, 0.75)",
            duration: 0.8,
          });
        } else {
          gsap.to(content, {
            xPercent: 0,
            ease: "elastic.out(1, 0.75)",
            duration: 0.8,
          });
        }
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const containerW = container.clientWidth;
      const mouseX = e.clientX - container.getBoundingClientRect().left;
      const percentage = mouseX / containerW;
      const activePortion = Math.ceil(percentage * cardsLength);

      if (
        currentPortionRef.current !== activePortion &&
        activePortion > 0 &&
        activePortion <= cardsLength
      ) {
        if (currentPortionRef.current !== 0) {
          resetPortion(currentPortionRef.current - 1);
        }
        currentPortionRef.current = activePortion;
        newPortion(currentPortionRef.current - 1);
      }
    };

    const handleMouseLeave = () => {
      if (currentPortionRef.current !== 0) {
        resetPortion(currentPortionRef.current - 1);
      }
      currentPortionRef.current = 0;

      gsap.to(contents, {
        xPercent: 0,
        ease: "elastic.out(1, 0.75)",
        duration: 0.8,
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .mwg025-section {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          background: #0a0a0a;
        }

        .mwg025-title {
          position: absolute;
          top: 25px;
          left: 25px;
          font: 500 normal 4vw/0.9 'Inter', sans-serif;
          letter-spacing: -0.03em;
          color: #f1f1f1;
        }

        .mwg025-container {
          display: flex;
        }

        .mwg025-card {
          width: 20vw;
          aspect-ratio: 0.8;
        }

        .mwg025-card:not(:first-child) {
          margin: 0 0 0 -10vw;
        }

        .mwg025-content {
          width: 100%;
          height: 100%;
          border-radius: 0.6em;
          color: #000;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 25px;
        }

        .mwg025-quote {
          font: 500 normal 1.9vw / 0.9 'Inter', sans-serif;
          letter-spacing: -0.03em;
        }

        .mwg025-bottom {
          display: flex;
          align-items: center;
          column-gap: 15px;
          font: 500 normal 1.1vw / 0.9 'Inter', sans-serif;
          letter-spacing: -0.03em;
          border-top: 1px dashed #000;
          padding: 25px 0 0;
        }

        .mwg025-bubble {
          width: 3.3vw;
          aspect-ratio: 1;
          border-radius: 100%;
          background-color: #fff;
          display: grid;
          place-items: center;
        }

        .mwg025-bubble img {
          width: 40%;
          height: 40%;
          object-fit: contain;
        }

        .mwg025-role {
          font: 500 normal 0.9vw / normal 'IBM Plex Mono', monospace;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .mwg025-title {
            font-size: 35px;
            padding: 15px;
          }
          .mwg025-card {
            width: 45vw;
          }
          .mwg025-card:not(:first-child) {
            margin: 0 0 0 -25vw;
          }
          .mwg025-quote,
          .mwg025-bottom {
            opacity: 0;
          }
        }
      `}</style>

      <section ref={sectionRef} className="mwg025-section">
        <p className="mwg025-title">
          They say it better
          <br />
          than we do
        </p>
        <div ref={containerRef} className="mwg025-container">
          {testimonials.map((t, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="mwg025-card"
              style={{ zIndex: zIndices[i] }}
            >
              <div
                ref={(el) => { contentRefs.current[i] = el; }}
                className="mwg025-content"
                style={{ backgroundColor: t.color }}
              >
                <p className="mwg025-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="mwg025-bottom">
                  <div className="mwg025-bubble">
                    <img src={t.avatar} alt="" />
                  </div>
                  <div>
                    <p>{t.name}</p>
                    <p className="mwg025-role">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
