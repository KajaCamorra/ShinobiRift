"use client";

import { useState, useEffect } from "react";
import BurgerButton from "@/components/ui/BurgerButton";
import MobileMenu, { MenuItem, MenuDivider } from "@/components/ui/MobileMenu";
import { cn } from "@/lib/utils";
import { FaDiscord, FaGoogle, FaFacebookF } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginResult } from '@/contexts/AuthContext/types';

type AuthProvider = 'discord' | 'google' | 'facebook';

interface AuthButtonProps {
  provider: AuthProvider;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-[calc(100%-15px)] z-[1002]",
        "transition-all duration-300",
        "border-b border-bright-blue/10",
        "bg-gradient-to-b from-dark-bg/65 via-dark-bg/50 to-dark-bg/30",
        "backdrop-blur-md",
        isScrolled
          ? "h-[60px] py-2 bg-dark-bg/85"
          : "h-[100px] py-6",
      )}>
      <div className="max-w-[1400px] mx-auto px-8 flex justify-between items-center h-full">
        {/* Mobile Menu Button */}
        <BurgerButton
          isOpen={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden"
        />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <NavigationLinks />
        </nav>

        {/* Play Now Button & Dropdown */}
        <div className="relative">
          <PlayNowButton
            isOpen={isDropdownOpen}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          />
          <AuthDropdown
            isOpen={isDropdownOpen}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          />
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="flex flex-col">
          {/* Navigation Links */}
          <div className="flex flex-col">
            <NavigationLinks mobile />
          </div>
          
          {/* Divider */}
          <MenuDivider />
          
          {/* Auth Buttons */}
          <div className="p-4 space-y-2">
            <AuthButtons />
          </div>
        </div>
      </MobileMenu>
    </header>
  );
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const links = ['Home', 'Blog', 'Lore', 'Rules'];

  if (mobile) {
    return (
      <>
        {links.map(link => (
          <MenuItem key={link} href="#">{link}</MenuItem>
        ))}
      </>
    );
  }

  return (
    <>
      {links.map(link => (
        <a key={link} href="#" className="nav-link">{link}</a>
      ))}
    </>
  );
}

function PlayNowButton({ isOpen, ...props }: { isOpen: boolean } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      {...props}
      className={cn(
        "font-goldman px-8 py-3",
        "bg-transparent border border-bright-blue text-bright-blue",
        "uppercase tracking-wider relative",
        "transition-all duration-300",
        "hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]",
        "after:absolute after:inset-0",
        "after:bg-bright-blue/5 after:opacity-0",
        "hover:after:opacity-100 after:transition-opacity"
      )}
    >
      PLAY NOW ▾
    </button>
  );
}

function AuthButton({ provider }: AuthButtonProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (provider !== 'discord') {
      alert('Coming soon!');
      return;
    }

    setLoading(true);
    let popup: Window | null = null;

    try {
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      popup = window.open(
        `/api/auth/discord`,
        'Discord Login',
        `width=${width},height=${height},top=${top},left=${left},status=yes,toolbar=no,menubar=no,location=no`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please enable popups for this site.');
      }

      const result = await new Promise<LoginResult>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'ERROR') {
            reject(new Error(event.data.data?.message || 'Authentication failed'));
          }

          if (event.data.type === 'SUCCESS') {
            resolve(event.data.data);
          }
        };

        window.addEventListener('message', handleMessage);

        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication window was closed'));
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (popup && !popup.closed) popup.close();
          reject(new Error('Authentication timed out'));
        }, 5 * 60 * 1000);
      });

      console.log('Login successful:', result);
      await login(result);
      router.push('/game');

    } catch (err) {
      console.error('Login error:', err);
      alert(err instanceof Error ? err.message : 'Authentication failed');
      if (popup && !popup.closed) popup.close();
    } finally {
      setLoading(false);
    }
  };

  const icons = {
    discord: <FaDiscord className="w-5 h-5" />,
    google: <FaGoogle className="w-5 h-5" />,
    facebook: <FaFacebookF className="w-5 h-5" />
  };

  const colors = {
    discord: 'hover:border-[#7289DA] hover:bg-[rgba(114,137,218,0.1)]',
    google: 'hover:border-[#DB4437] hover:bg-[rgba(219,68,55,0.1)]',
    facebook: 'hover:border-[#4267B2] hover:bg-[rgba(66,103,178,0.1)]'
  };

  return (
    <button
      onClick={handleAuth}
      disabled={loading}
      className={cn(
        "flex items-center gap-4 w-full p-4 my-1",
        "bg-bright-blue/5 border border-bright-blue/20",
        "text-text cursor-pointer transition-all duration-200",
        "hover:translate-x-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        colors[provider]
      )}
    >
      {icons[provider]}
      <span>
        {loading ? 'Connecting...' : `Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
      </span>
    </button>
  );
}

function AuthButtons() {
  const providers = ['discord', 'google', 'facebook'] as const;
  
  return (
    <div className="flex flex-col gap-1">
      {providers.map((provider) => (
        <AuthButton key={provider} provider={provider} />
      ))}
    </div>
  );
}

function AuthDropdown({ isOpen, ...props }: { isOpen: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      {...props}
      className={cn(
        "absolute top-[calc(100%+5px)] right-0",
        "bg-dark-bg/95 backdrop-blur-md",
        "min-w-[250px] p-2",
        "opacity-0 invisible transition-all duration-300",
        "border border-bright-blue/10",
        "shadow-[0_0_20px_rgba(0,229,255,0.1)]",
        isOpen && "opacity-100 visible"
      )}
    >
      <AuthButtons />
    </div>
  );
}
