import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  url: string;
  icon: React.ElementType;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navItems }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!isOpen) return null;
  
  const handleNavClick = (item: NavItem, event: React.MouseEvent) => {
    event.preventDefault();
    console.log(`Mobile menu: clicked item ${item.name}, url: ${item.url}`);
    
    // First close the menu
    onClose();
    
    // For direct page navigation that's not hash-based
    if (!item.url.startsWith('#')) {
      console.log(`Mobile menu: direct navigation to ${item.url}`);
      navigate(item.url);
      return;
    }
    
    // For hash navigation
    // If we're not on homepage and trying to navigate to a section
    if (location.pathname !== '/') {
      console.log('Mobile menu: navigating to home first');
      navigate('/');
      // Allow the navigation to complete before scrolling
      setTimeout(() => {
        const element = document.querySelector(item.url);
        if (element) {
          console.log(`Mobile menu: scrolling to element ${item.url}`);
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Direct scroll if already on homepage
      console.log(`Mobile menu: already on homepage, scrolling to ${item.url}`);
      const element = document.querySelector(item.url);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 pt-16 bg-black/90 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <nav className="flex flex-col items-center space-y-6 pt-8 animate-fade-in">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url || 
              (location.pathname === '/' && item.url.startsWith('#'));
            
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: i * 0.1 }
                }}
              >
                <a
                  href={item.url}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 py-3 text-lg font-medium rounded-lg",
                    "text-gray-300 hover:text-white hover:bg-chatta-purple/20 transition-colors",
                    isActive && "text-white bg-chatta-purple/20"
                  )}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </a>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
};

export default MobileMenu;
