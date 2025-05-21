
import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 pt-16 bg-chatta-darker bg-opacity-95 backdrop-blur-lg"
    >
      <div className="container mx-auto px-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <nav className="flex flex-col items-center space-y-6 pt-8">
          {navItems.map((item, i) => {
            const Icon = item.icon;
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
                <Link
                  to={item.url}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 text-lg font-medium rounded-lg",
                    "text-gray-300 hover:text-white hover:bg-chatta-purple/20 transition-colors"
                  )}
                  onClick={onClose}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
};

export default MobileMenu;
