type NewsItem = {
    date: string;
    title: string;
    description: string;
  };
  
  const NEWS_ITEMS: NewsItem[] = [
    {
      date: "November 9, 2024",
      title: "New Dimension Discovered",
      description: "Explore the Crystal Wastes in our latest content update!"
    },
    {
      date: "November 7, 2024",
      title: "Balance Changes",
      description: "Adjustments to combat mechanics and skill progression."
    },
    {
      date: "November 5, 2024",
      title: "Community Event",
      description: "Join the Shadow Tournament this weekend!"
    }
  ];
  
  export default function NewsSection() {
    return (
      <aside className="bg-neon-pink/5 p-10 border border-neon-pink/10 flex flex-col justify-center">
        <h2 className="font-goldman text-3xl text-neon-pink mb-8 tracking-wide">
          Latest Updates
        </h2>
        <div className="space-y-8">
          {NEWS_ITEMS.map((item, index) => (
            <NewsItem 
              key={index}
              date={item.date}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </aside>
    );
  }
  
  function NewsItem({ date, title, description }: NewsItem) {
    return (
      <article className="pb-8 border-b border-neon-pink/20 last:border-0 last:pb-0">
        <time className="block text-sm text-neon-pink mb-2 font-medium">
          {date}
        </time>
        <h3 className="text-xl mb-2 font-semibold">
          {title}
        </h3>
        <p className="text-text/80">
          {description}
        </p>
      </article>
    );
  }