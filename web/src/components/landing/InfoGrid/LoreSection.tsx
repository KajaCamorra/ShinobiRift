import { ArrowRight } from 'lucide-react';

export default function LoreSection() {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-bright-blue/5 p-10 
                        border border-bright-blue/10 shadow-[0_0_30px_rgba(0,229,255,0.05)]">
        <div className="flex flex-col justify-center">
          <h2 className="font-goldman text-4xl text-bright-blue mb-6 tracking-wide">
            A World Transformed
          </h2>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              In the wake of the Great Unraveling, reality itself has been torn asunder. 
              Ancient ninja clans, once guardians of dimensional stability, now navigate 
              a world where the laws of physics bend and time itself flows like water.
            </p>
            <p>
              Choose your path, forge alliances, and decide the fate of this fractured reality. 
              Will you seek to restore the old order, or embrace the chaos to forge something 
              entirely new?
            </p>
          </div>
          <a href="#" className="group inline-flex items-center text-bright-blue mt-6 
                              transition-all duration-300 hover:text-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
            <span className="relative">
              Discover The Full Story
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-bright-blue 
                           transition-all duration-300 group-hover:w-full"/>
            </span>
            <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
        <div className="h-full border border-bright-blue/20">
          <img 
            src="/assets/images/landing/rift1.png"
            alt="Dimensional Rift"
            className="w-full h-full object-cover"
          />
        </div>
      </section>
    );
  }