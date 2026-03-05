"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

interface CardData {
  name: string;
  genre: string;
  color: string;
  image: string;
}

const cards: CardData[] = [
  { name: "Recording", genre: "record deal", color: "#BCEFFF", image: "/cards/1.jpg" },
  { name: "Publishing", genre: "publishing", color: "#C9FE6E", image: "/cards/2.jpg" },
  { name: "Management", genre: "management", color: "#FAFF9E", image: "/cards/3.jpg" },
  { name: "Distribution", genre: "distribution", color: "#FC4C3B", image: "/cards/4.jpg" },
  { name: "Sync Deal", genre: "sync licensing", color: "#F1F1F1", image: "/cards/5.jpg" },
  { name: "Producer", genre: "producer deal", color: "#8CEDFF", image: "/cards/6.jpg" },
  { name: "360 Deal", genre: "full service", color: "#FAFF9E", image: "/cards/7.jpg" },
];

export default function HorizontalGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const container = containerRef.current;
      const cardsContainer = cardsContainerRef.current;
      if (!container || !cardsContainer) return;

      const distance = cardsContainer.clientWidth - window.innerWidth;

      const scrollTween = gsap.to(cardsContainer, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: true,
          start: "top top",
          end: "+=" + distance,
        },
      });

      cardRefs.current.forEach((card) => {
        if (!card) return;

        const values = {
          x: (Math.random() * 20 + 30) * (Math.random() < 0.5 ? 1 : -1),
          y: (Math.random() * 6 + 10) * (Math.random() < 0.5 ? 1 : -1),
          rotation: (Math.random() * 10 + 10) * (Math.random() < 0.5 ? 1 : -1),
        };

        gsap.fromTo(
          card,
          {
            rotation: values.rotation,
            xPercent: values.x,
            yPercent: values.y,
          },
          {
            rotation: -values.rotation,
            xPercent: -values.x,
            yPercent: -values.y,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: "left 120%",
              end: "right -20%",
              scrub: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .mwg_effect001 {
          overflow: hidden;
          position: relative;
        }

        .mwg_effect001 .mwg-header {
          position: absolute;
          width: 100%;
          display: flex;
          align-items: center;
          font: 500 normal clamp(12px, 0.9vw, 100px) / normal 'IBM Plex Mono', monospace;
          text-transform: uppercase;
          padding: 25px;
          top: 0;
          left: 0;
          color: #F1F1F1;
          z-index: 10;
        }

        .mwg_effect001 .mwg-header > * {
          flex: 1;
        }

        .mwg_effect001 .mwg-header > *:nth-child(2) {
          text-align: center;
        }

        .mwg_effect001 .mwg-header > *:nth-child(3) {
          text-align: right;
        }

        .mwg_effect001 .mwg-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100vh;
          width: 100%;
          font-size: clamp(12px, 1vw, 20px);
          background: #121212;
        }

        .mwg_effect001 .mwg-cards {
          display: flex;
          width: max-content;
          white-space: nowrap;
          gap: 1vw;
          will-change: transform;
          padding: 0 120vw;
        }

        .mwg_effect001 .mwg-card {
          position: relative;
          width: 25vw;
          min-width: 280px;
          aspect-ratio: 0.75;
          border-radius: 2vw;
          overflow: hidden;
          object-fit: cover;
          text-align: center;
          text-transform: uppercase;
          border: 0.5vw solid currentColor;
          font-family: 'Inter', sans-serif;
        }

        .mwg_effect001 .mwg-card img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -1;
        }

        .mwg_effect001 .mwg-card-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }

        .mwg_effect001 .mwg-card-content p {
          display: flex;
          justify-content: space-between;
          padding: 0.5em 1em;
        }

        .mwg_effect001 .mwg-from {
          border: 0.2em solid currentColor;
          border-radius: 100%;
          padding: 0.28em 0.3em 0.12em;
        }

        .mwg_effect001 .mwg-card-content h2 {
          font: 800 normal 4.5vw / 0.8 'Inter', sans-serif;
          text-wrap: auto;
          padding: 0.2em 0 0.12em;
        }

        @media (max-width: 900px) {
          .mwg_effect001 .mwg-header {
            flex-direction: column;
            padding: 15px;
          }

          .mwg_effect001 .mwg-cards {
            padding: 0 140vw;
          }

          .mwg_effect001 .mwg-card {
            border: 6px solid currentColor;
            border-radius: 23px;
          }

          .mwg_effect001 .mwg-card-content h2 {
            font-size: 54px;
          }
        }
      `}</style>

      <section ref={sectionRef} className="mwg_effect001">
        <div ref={containerRef} className="mwg-container">
          <div className="mwg-header">
            <p>EasyTerms datas</p>
            <p>Common contract types we analyze</p>
            <p>8 types</p>
          </div>
          <div ref={cardsContainerRef} className="mwg-cards">
            {cards.map((card, index) => (
              <div
                key={index}
                ref={(el) => { cardRefs.current[index] = el; }}
                className="mwg-card"
                style={{ color: card.color }}
              >
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  sizes="(max-width: 900px) 280px, 25vw"
                  style={{ objectFit: "cover", zIndex: -1 }}
                />
                <div className="mwg-card-content">
                  <p>
                    <span>Contract</span>
                    <span>{card.genre}</span>
                  </p>
                  <div>
                    <span className="mwg-from">Type</span>
                    <h2>{card.name}</h2>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
