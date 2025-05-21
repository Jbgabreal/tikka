
import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    // Handle navigation differently based on URL type
    if (item.url.startsWith('#')) {
      // If we're not on homepage and trying to navigate to a section
      if (location.pathname !== '/') {
        navigate('/');
        // Allow the navigation to complete before scrolling
        setTimeout(() => {
          const element = document.querySelector(item.url);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Direct scroll if already on homepage
        const element = document.querySelector(item.url);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
      onClose();
      event.preventDefault();
    } else {
      // Regular page navigation
      navigate(item.url);
      onClose();
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
