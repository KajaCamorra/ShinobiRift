"use client";

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

type CarouselImage = {
  src: string;
  alt: string;
  caption: string;
};

const IMAGES: CarouselImage[] = [
  {
    src: '/assets/images/landing/forest1.png',
    alt: 'Game Screenshot 1',
    caption: 'Master ancient ninja techniques in a world torn by dimensional rifts',
  },
  {
    src: '/assets/images/landing/city1.png',
    alt: 'Game Screenshot 2',
    caption: 'Explore vast landscapes filled with mystery and danger',
  },
  {
    src: '/assets/images/landing/fluxzone2.png',
    alt: 'Game Screenshot 3',
    caption: 'Engage in tactical combat with other players',
  },
];

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % IMAGES.length);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="w-full py-16">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="relative bg-bright-blue/5 backdrop-blur-sm border border-bright-blue/10 
                      shadow-[0_0_30px_rgba(0,229,255,0.05)] p-8
                      before:absolute before:inset-0 
                      before:from-[#01000A]/20 before:to-transparent before:-z-10">
          <div className="relative h-[70vh] md:h-[600px] overflow-hidden">
            {/* Slides */}
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {IMAGES.map((image, index) => (
                <CarouselSlide key={index} {...image} />
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
              {IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "w-12 h-[3px] transition-all duration-300",
                    currentSlide === index
                      ? "bg-bright-blue shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                      : "bg-bright-blue/30"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CarouselSlide({ src, alt, caption }: CarouselImage) {
  return (
    <div className="min-w-full h-full flex flex-col items-center gap-6">
      <div className="relative w-full h-[85%] border border-bright-blue/10">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="neon-text text-lg text-center font-medium">
        {caption}
      </p>
    </div>
  );
}