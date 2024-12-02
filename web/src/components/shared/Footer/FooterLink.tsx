interface FooterLinkProps {
    href: string;
    children: React.ReactNode;
  }
  
  export default function FooterLink({ href, children }: FooterLinkProps) {
    return (
      <a
        href={href}
        className="text-text/70 no-underline text-sm transition-colors duration-300 
                   hover:text-bright-blue"
      >
        {children}
      </a>
    );
  }