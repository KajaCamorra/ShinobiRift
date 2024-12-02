import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Carousel from '@/components/landing/Carousel';
import InfoGrid from '@/components/landing/InfoGrid';
import Footer from '@/components/shared/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#01000A]">
      <Header />
      <Hero />
      <div 
        className="relative"
        style={{
          backgroundImage: `url('/assets/images/landing/bg_darktextured.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient overlay for smooth transition */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #01000A 0%, rgba(1, 0, 10, 0.8) 15%, rgba(1, 0, 10, 0.1) 40%, rgba(1, 0, 10, 0.1) 100%)',
          }}
        />
        
        <div className="relative max-w-[1400px] mx-auto">
          <Carousel />
          <InfoGrid />
        </div>
      </div>
      <Footer />
    </div>
  );
}
