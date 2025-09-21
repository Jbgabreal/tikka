import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ExternalLink, Rocket, LogOut, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      
      // Update active section based on scroll position
      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + 100; // Offset for navbar
      
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId || "");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navItems = [
            { name: "Use Cases", href: "#meet-tikka" },
    { name: "FAQ", href: "#faq" },
    { name: "Docs", href: "/docs" },
    { name: "Community", href: "/community" },
  ];

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const buyUrl = `https://pump.fun/coin/${contractAddress}`;

  const handleBuyToken = () => {
    window.open(buyUrl, '_blank');
  };

  const handleLaunchApp = () => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      navigate('/auth');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      // Smooth scroll to section with navbar offset
      const element = document.querySelector(href);
      if (element) {
        const navbarHeight = 80; // Height of the navbar
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update active section
        setActiveSection(href.substring(1));
      }
    } else {
      navigate(href);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-500/20 dark:border-orange-500/20"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-16 h-12 md:w-20 md:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <img src="/lovable-uploads/tikka-logo-text.png.png" alt="Tikka" className="h-11 w-15 md:h-14 md:w-18 object-contain" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = item.href.startsWith('#') && activeSection === item.href.substring(1);
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium relative group ${
                    isActive ? 'text-gray-900 dark:text-white' : ''
                  }`}
                >
                  {item.name}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </button>
              );
            })}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBuyToken}
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              Buy $TIKKA
            </Button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <User className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleLaunchApp}
                rightIcon={<Rocket className="w-4 h-4" />}
              >
                Launch App
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-900 dark:text-white p-2 hover:bg-orange-500/10 rounded-lg transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-500/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => {
                const isActive = item.href.startsWith('#') && activeSection === item.href.substring(1);
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 font-medium text-left py-2 px-4 hover:bg-orange-500/10 rounded-lg ${
                      isActive ? 'text-gray-900 dark:text-white bg-orange-500/20' : ''
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
              <div className="flex flex-col space-y-2 pt-4 border-t border-orange-500/20">
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBuyToken}
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                  className="w-full"
                >
                  Buy $TIKKA
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLaunchApp}
                  rightIcon={<Rocket className="w-4 h-4" />}
                  className="w-full"
                >
                  Launch App
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
