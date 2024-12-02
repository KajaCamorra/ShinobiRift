export default function Hero() {
  return (
    <section className="relative h-screen flex flex-col justify-center items-center text-center">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: `linear-gradient(to bottom, rgba(1, 0, 10, 0.7), rgba(1, 0, 10, 0.5)), url('/assets/images/landing/bg14.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Bottom Gradient Fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[300px] z-20"
        style={{
          background: 'linear-gradient(to top, #01000A, transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-30 px-4 max-w-[1400px] mx-auto w-full">
        <h1 className="font-goldman text-5xl md:text-7xl mb-4 text-bright-blue 
                     tracking-wider drop-shadow-[0_0_20px_rgba(0,229,255,0.5)]">
          SHINOBI RIFT
        </h1>
        
        <p className="text-lg md:text-xl max-w-[700px] mx-auto mb-10 tracking-wide leading-relaxed font-normal">
          Enter a world where ancient ninja arts clash with dimensional chaos. 
          Master your skills, forge alliances, and shape the destiny of a fractured reality.
        </p>

        <a 
          href="#" 
          className="inline-block relative overflow-hidden
                   font-syne font-semibold px-12 py-5 text-lg
                   text-bright-blue bg-bright-blue/10 border-2 border-bright-blue
                   cursor-pointer transition-all duration-300 tracking-wider uppercase
                   hover:bg-bright-blue hover:text-[#01000A]
                   hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]"
        >
          Begin Your Journey
        </a>
      </div>
    </section>
  );
}
