"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";

const trailImages = Array.from({ length: 12 }, (_, i) =>
  `/footer-medias/${String(i + 1).padStart(2, "0")}.png`
);

const footerSections = [
  { title: "Product", links: [["Analyze", "/analyze"], ["Dashboard", "/dashboard"], ["Templates", "/dashboard/templates"], ["Pricing", "/pricing"]] },
  { title: "Resources", links: [["FAQ", "/dashboard/faq"], ["Blog", "/dashboard/blog"]] },
  { title: "Company", links: [["About", "#"], ["Contact", "#"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export default function FooterMouseTrail() {
  const rootRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const incrRef = useRef(0);
  const oldPosRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);

  const createMedia = useCallback((x: number, y: number, deltaX: number, deltaY: number) => {
    const root = rootRef.current;
    if (!root) return;

    const image = document.createElement("img");
    image.setAttribute("src", trailImages[indexRef.current]);
    image.className = "footer-trail-img";
    root.appendChild(image);

    const tl = gsap.timeline({
      onComplete: () => {
        if (root.contains(image)) root.removeChild(image);
        tl.kill();
      },
    });

    tl.fromTo(
      image,
      {
        xPercent: -50 + (Math.random() - 0.5) * 80,
        yPercent: -50 + (Math.random() - 0.5) * 10,
        scaleX: 1.3,
        scaleY: 1.3,
      },
      {
        scaleX: 1,
        scaleY: 1,
        ease: "elastic.out(2, 0.6)",
        duration: 0.6,
      }
    );

    tl.fromTo(
      image,
      {
        x,
        y,
        rotation: (Math.random() - 0.5) * 20,
      },
      {
        x: "+=" + deltaX * 4,
        y: "+=" + deltaY * 4,
        rotation: (Math.random() - 0.5) * 20,
        ease: "power4.out",
        duration: 1.5,
      },
      "<"
    );

    tl.to(image, {
      duration: 0.3,
      scale: 0.5,
      delay: 0.1,
      ease: "back.in(1.5)",
    });

    indexRef.current = (indexRef.current + 1) % trailImages.length;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const resetDist = window.innerWidth / 8;

    const handleFirstMove = (e: MouseEvent) => {
      oldPosRef.current = { x: e.clientX, y: e.clientY };
      initializedRef.current = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!initializedRef.current) {
        handleFirstMove(e);
        return;
      }

      const valX = e.clientX;
      const valY = e.clientY;

      incrRef.current += Math.abs(valX - oldPosRef.current.x) + Math.abs(valY - oldPosRef.current.y);

      if (incrRef.current > resetDist) {
        incrRef.current = 0;
        const rect = root.getBoundingClientRect();
        createMedia(
          valX - rect.left,
          valY - rect.top,
          valX - oldPosRef.current.x,
          valY - oldPosRef.current.y
        );
      }

      oldPosRef.current = { x: valX, y: valY };
    };

    root.addEventListener("mousemove", handleMouseMove);
    return () => root.removeEventListener("mousemove", handleMouseMove);
  }, [createMedia]);

  return (
    <div ref={rootRef} className="footer-mouse-trail relative overflow-hidden">
      {/* Preload images (hidden) */}
      <div className="hidden">
        {trailImages.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>

      {/* CTA Section */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center px-6">
        <p
          className="text-center uppercase tracking-[-0.05em] leading-[0.76]"
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontWeight: 400,
            fontStyle: "italic",
            fontSize: "clamp(60px, 9vw, 156px)",
            lineHeight: 0.76,
            width: "56%",
            color: "rgb(241, 241, 241)",
          }}
        >
          Your Music. Your Terms.
        </p>
        <Link
          href="/analyze"
          className="mt-10 h-14 px-10 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all flex items-center gap-3 relative z-20"
          style={{ fontFamily: 'var(--font-circular), sans-serif' }}
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <img src="/darkModeS.svg" alt="EasyTerms" className="h-6 mb-4" />
              <p className="text-sm text-white/40" style={{ fontFamily: 'var(--font-circular), sans-serif' }}>
                Contract analysis for creators.
              </p>
            </div>

            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-medium text-white mb-4" style={{ fontFamily: 'var(--font-circular), sans-serif' }}>{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-white/40 hover:text-white transition-colors" style={{ fontFamily: 'var(--font-circular), sans-serif' }}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.06]">
            <p className="text-sm text-white/30" style={{ fontFamily: 'var(--font-circular), sans-serif' }}>
              &copy; {new Date().getFullYear()} EasyTerms. All rights reserved.
            </p>
            <p className="text-sm text-white/30 mt-2 md:mt-0" style={{ fontFamily: 'var(--font-circular), sans-serif' }}>
              Your data is encrypted and never shared.
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .footer-trail-img {
          width: 15vw;
          height: 15vw;
          position: absolute;
          object-fit: cover;
          border-radius: 4%;
          z-index: 5;
          pointer-events: none;
          top: 0;
          left: 0;
        }
        @media (max-width: 768px) {
          .footer-mouse-trail .footer-trail-img {
            width: 30vw;
            height: 30vw;
          }
        }
      `}</style>
    </div>
  );
}
