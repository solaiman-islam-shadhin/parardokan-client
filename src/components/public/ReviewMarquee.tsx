import { useEffect, useMemo, useRef, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface Review {
  name: string;
  role: string;
  text: string;
}

interface ReviewMarqueeProps {
  reviews: Review[];
  reverse?: boolean;
}

export default function ReviewMarquee({ reviews, reverse = false }: ReviewMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const [groupWidth, setGroupWidth] = useState(0);

  const repeatedReviews = useMemo(() => [...reviews, ...reviews], [reviews]);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setGroupWidth(trackRef.current.scrollWidth / 2);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, [reviews]);

  useEffect(() => {
    if (!groupWidth || !trackRef.current) return;
    let frame = 0;
    let lastTime = performance.now();
    const baseSpeed = 34;

    const animate = (time: number) => {
      const elapsed = Math.min(time - lastTime, 40);
      lastTime = time;
      if (!draggingRef.current) {
        const direction = reverse ? 1 : -1;
        const momentum = velocityRef.current * 0.08;
        positionRef.current += direction * baseSpeed * (elapsed / 1000) + momentum;
        velocityRef.current *= 0.9;
      }
      if (positionRef.current <= -groupWidth) positionRef.current += groupWidth;
      if (positionRef.current >= 0) positionRef.current -= groupWidth;
      trackRef.current!.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [groupWidth, reverse]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    lastXRef.current = event.clientX;
    velocityRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !groupWidth) return;
    const delta = event.clientX - lastXRef.current;
    lastXRef.current = event.clientX;
    velocityRef.current = delta;
    positionRef.current += delta;
    if (positionRef.current <= -groupWidth) positionRef.current += groupWidth;
    if (positionRef.current >= 0) positionRef.current -= groupWidth;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
    }
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  return (
    <div
      ref={viewportRef}
      className="review-marquee"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div ref={trackRef} className="review-marquee-track">
        {repeatedReviews.map(({ name, role, text }, index) => (
          <motion.article
            key={`${name}-${index}`}
            whileHover={{ y: -6 }}
            className="review-card group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="review-avatar">{name.charAt(0)}</div>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-base-content/50">{role}</p>
                </div>
              </div>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, star) => (
                  <Star key={star} size={14} fill="currentColor" />
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-base-content/70">"{text}"</p>
            <div className="mt-5 h-1 w-10 rounded-full bg-primary/50 transition-all duration-300 group-hover:w-16 group-hover:bg-primary" />
          </motion.article>
        ))}
      </div>
    </div>
  );
}
