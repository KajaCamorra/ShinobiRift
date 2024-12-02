interface FooterSectionProps {
    title: string;
    children: React.ReactNode;
  }
  
  export default function FooterSection({ title, children }: FooterSectionProps) {
    return (
      <div className="footer-section">
        <h3 className="font-goldman text-bright-blue mb-4 text-lg">
          {title}
        </h3>
        {children}
      </div>
    );
  }