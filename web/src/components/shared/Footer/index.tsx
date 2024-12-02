import { MessageSquareMore } from 'lucide-react';
import FooterLink from './FooterLink';

const FOOTER_LINKS = [
  // Row 1 - Support and additional links
  [
    { href: '#', text: 'Help Center' },
    { href: '#', text: 'Contact Us' },
    { href: '#', text: 'Community Guidelines' },
    { href: '#', text: 'Game Rules' },
    { href: '#', text: 'Bug Reports' },
    { href: '#discord', icon: MessageSquareMore, ariaLabel: 'Join our Discord server' },
  ],
  // Row 2 - Legal essentials
  [
    { href: '#', text: 'Terms of Service' },
    { href: '#', text: 'Privacy Policy' },
    { href: '#', text: 'Cookie Policy' },
    { href: '#', text: 'GDPR Rights' },
    { href: '#', text: 'Impressum' },
  ]
] as const;

type FooterLink = 
  | { href: string; text: string }
  | { href: string; icon: typeof MessageSquareMore; ariaLabel: string };

export default function Footer() {
  return (
    <footer className="bg-dark-bg/95 border-t border-bright-blue/10 py-2 relative z-[100]">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex flex-col">
          {FOOTER_LINKS.map((row, rowIndex) => (
            <div key={rowIndex}>
              <div className="flex items-center justify-center flex-wrap gap-x-1 text-xs">
                {row.map((link: FooterLink, linkIndex) => (
                  <div key={'text' in link ? link.text : `icon-${linkIndex}`} className="flex items-center">
                    <a 
                      href={link.href}
                      className={
                        'icon' in link
                          ? "text-bright-blue hover:text-bright-blue/80 transition-colors p-1 hover:bg-bright-blue/10 rounded"
                          : "text-text/70 hover:text-text transition-colors px-3 py-1"
                      }
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {'icon' in link ? (
                        <link.icon 
                          className="w-4 h-4" 
                          aria-label={link.ariaLabel}
                        />
                      ) : (
                        <span>{link.text}</span>
                      )}
                    </a>
                    {linkIndex < row.length - 1 && 'text' in link && (
                      <div className="h-3 w-[1px] bg-gradient-to-b from-transparent via-bright-blue/20 to-transparent" />
                    )}
                  </div>
                ))}
              </div>
              {rowIndex === 0 && (
                <div className="my-2 h-[1px] mx-auto w-[80%] bg-gradient-to-r 
                  from-transparent via-bright-blue/20 to-transparent
                  relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2
                    border border-bright-blue/20 rotate-45" />
                </div>
              )}
            </div>
          ))}
          
          {/* Copyright Notice */}
          <div className="text-center mt-1 pt-2">
            <p className="text-text/40 text-[10px]">
              © {new Date().getFullYear()} Wasabi Solutions
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
