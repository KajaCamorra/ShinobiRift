import LoreSection from './LoreSection';
import NewsSection from './NewsSection';

export default function InfoGrid() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8 mb-16">
      <LoreSection />
      <NewsSection />
    </div>
  );
}
