import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Carousel from "@/components/landing/Carousel";
import InfoGrid from "@/components/landing/InfoGrid";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#01000A]">
      <Header />
      <Hero />
      <div 
        className="relative bg-gradient-to-b from-[#01000A] via-transparent to-transparent"
        style={{
          backgroundImage: `url('/assets/images/landing/bg_darktextured.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative max-w-[1400px] mx-auto">
          <Carousel />
          <InfoGrid />
        </div>
      </div>
      <Footer />
    </div>
  );
}