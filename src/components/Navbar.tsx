
import { Home, User, Briefcase, FileText, MessageSquare, ExternalLink, Menu } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import MobileMenu from "./MobileMenu"

export function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'How It Works', url: '#how-it-works', icon: User },
    { name: 'Features', url: '#features', icon: Briefcase },
    { name: 'Docs', url: '#docs', icon: FileText },
    { name: 'Chat', url: '/chat', icon: MessageSquare }
  ]

  const handleLaunchApp = () => {
    navigate('/chat');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo - Left */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/4e3faff9-aeeb-4667-84fe-6c0002c1fca1.png" 
            alt="Chatta" 
            className="h-9 mr-4"
          />
        </div>
        
        {/* Navigation - Center/Left */}
        <div className="hidden md:block flex-grow">
          <NavBar items={navItems} className="sm:mx-auto" />
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-white hover:bg-chatta-purple/10 rounded-md transition-colors"
          onClick={toggleMobileMenu}
        >
          <Menu size={24} />
        </button>
        
        {/* Launch App Button - Right */}
        <Button 
          className="bg-chatta-purple hover:bg-chatta-purple/90 text-white rounded-full px-5 py-2 glow transition-all hover:scale-105"
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
