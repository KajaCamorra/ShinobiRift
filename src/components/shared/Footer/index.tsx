import { MessageSquare } from 'lucide-react';
import FooterSection from './FooterSection';
import FooterLink from './FooterLink';

const FOOTER_LINKS = {
  legal: [
    { href: '#', text: 'Terms of Service' },
    { href: '#', text: 'Privacy Policy' },
    { href: '#', text: 'Cookie Policy' },
    { href: '#', text: 'GDPR Rights' },
    { href: '#', text: 'Impressum' },
  ],
  support: [
    { href: '#', text: 'Help Center' },
    { href: '#', text: 'Bug Reports' },
    { href: '#', text: 'Contact Us' },
    { href: '#', text: 'Community Guidelines' },
  ],
  connect: [
    { href: '#', text: 'Discord', icon: MessageSquare },
  ],
} as const;

export default function Footer() {
  return (
    <footer className="bg-dark-bg/95 border-t border-bright-blue/10 pt-16 pb-8">
      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-8 mb-16">
          {/* Legal Section */}
          <FooterSection title="Legal">
            <div className="flex flex-col gap-2">
              {FOOTER_LINKS.legal.map(link => (
                <FooterLink key={link.text} href={link.href}>
                  {link.text}
                </FooterLink>
              ))}
            </div>
          </FooterSection>

          {/* Support Section */}
          <FooterSection title="Support">
            <div className="flex flex-col gap-2">
              {FOOTER_LINKS.support.map(link => (
                <FooterLink key={link.text} href={link.href}>
                  {link.text}
                </FooterLink>
              ))}
            </div>
          </FooterSection>

          {/* Connect Section */}
          <FooterSection title="Connect">
            <div className="flex flex-col gap-2">
              {FOOTER_LINKS.connect.map(({ text, href, icon: Icon }) => (
                <FooterLink key={text} href={href}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{text}</span>
                  </div>
                </FooterLink>
              ))}
            </div>
          </FooterSection>
        </div>

        {/* Copyright Notice */}
        <div className="pt-8 border-t border-bright-blue/10 text-center">
          <p className="text-text/50 text-sm">
            Shinobi Rift © {new Date().getFullYear()} Wasabi Solutions.
          </p>
        </div>
      </div>
    </footer>
  );
}