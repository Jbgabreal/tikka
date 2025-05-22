import { Home, User, Briefcase, FileText, MessageSquare, ExternalLink, Menu } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import { Button } from "@/components/ui/button"
import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import MobileMenu from "./MobileMenu"

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'How It Works', url: '#how-it-works', icon: User },
    { name: 'Features', url: '#features', icon: Briefcase },
    { name: 'Docs', url: '#docs', icon: FileText },
    { name: 'Chat', url: '/chat', icon: MessageSquare }
  ]

  // Find the active nav item based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const navItem = navItems.find(item => {
      // For hash routes, check if we're on homepage
      if (item.url.startsWith('#')) {
        return currentPath === '/';
      }
      // For other routes, check exact match
      return item.url === currentPath;
    });
  }, [location, navItems]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLaunchApp = () => {
    navigate('/chat');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/60 backdrop-blur-md py-2 border-b border-chatta-purple/10 shadow-sm'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo - Left */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/4e3faff9-aeeb-4667-84fe-6c0002c1fca1.png" 
            alt="Chatta" 
            className="h-8 sm:h-9 mr-3"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        {/* Navigation - Center */}
        <div className="hidden md:flex justify-center flex-grow">
          <div className="inline-flex">
            <NavBar items={navItems} className="sm:mx-auto" />
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-white hover:bg-chatta-purple/10 rounded-md transition-colors mr-2"
          onClick={toggleMobileMenu}
        >
          <Menu size={24} />
        </button>
        
        {/* Launch App Button - Right */}
        <Button 
          variant="chatta"
          size="chatta"
          onClick={handleLaunchApp}
        >
          <ExternalLink size={18} className="mr-2" />
          Launch App
        </Button>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={toggleMobileMenu} navItems={navItems} />
    </div>
  )
}

export default Navbar;
