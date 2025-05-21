
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, ChevronDown, Trash2, Download, Languages, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ChatSidebar from "@/components/chat/ChatSidebar";

// Background ambient dot animation
const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#12121a,_#0a090e)]">
        {/* Ambient dots */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-chatta-purple/5"
            style={{
              width: `${Math.random() * 10 + 3}px`,
              height: `${Math.random() * 10 + 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.3
            }}
          />
        ))}
      </div>
      
      {/* Subtle glow in top-left */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-chatta-purple/10 blur-[100px] rounded-full" />
      
      {/* Secondary glow */}
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-chatta-cyan/5 blur-[80px] rounded-full" />
    </div>
  );
};

const Settings = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState("0xF2...9J3");
  
  const [settings, setSettings] = useState({
    responseDetail: "balanced",
    tone: "professional",
    showCommandPreviews: true,
    theme: "dark",
    fontSize: "medium",
    language: "English",
    saveChats: true,
    useHistory: true,
    tokenAlerts: true,
    swapConfirmations: true
  });
  
  // Handle setting changes
  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };
  
  // Handle wallet disconnect
  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
  };
  
  // For responsive design
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-chatta-darker overflow-hidden relative">
      {/* Background with ambient effects */}
      <AmbientBackground />

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-4 left-4 z-50 rounded-full bg-chatta-purple/20 p-2"
        >
          <div className="w-6 h-0.5 bg-white mb-1"></div>
          <div className="w-6 h-0.5 bg-white mb-1"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: isMobile && !showSidebar ? -260 : 0 }}
        animate={{ x: showSidebar ? 0 : -260 }}
        transition={{ duration: 0.3 }}
        className="fixed md:relative z-40 md:z-auto h-full"
        style={{ width: '260px' }}
      >
        <ChatSidebar 
          onClose={isMobile ? () => setShowSidebar(false) : undefined}
        />
      </motion.div>
      
      {/* Main Settings Area - Centered relative to the page width */}
      <div className="fixed inset-0 flex justify-center">
        {/* Offset sidebar space on non-mobile */}
        <div className={cn(
          "hidden md:block",
          showSidebar ? "w-[260px]" : "w-0"
        )}></div>
        
        {/* Main content container */}
        <div className="w-full max-w-[720px] flex flex-col h-screen bg-gradient-to-b from-black/5 to-transparent backdrop-blur-sm relative z-10 overflow-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            <div className="space-y-6">
              {/* Wallet & Account Section */}
              <Card className="neo-blur">
                <CardHeader>
                  <CardTitle>Wallet & Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Connected Wallet</p>
                      <p className="font-medium">{walletAddress}</p>
                    </div>
                    <Button 
                      variant="chatta-secondary"
                      size="chatta"
                      onClick={handleDisconnectWallet}
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Preferences Section */}
              <Card className="neo-blur">
                <CardHeader>
                  <CardTitle>AI Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Response Detail Level</p>
                    <ToggleGroup 
                      type="single" 
                      value={settings.responseDetail}
                      onValueChange={(value) => value && handleSettingChange('responseDetail', value)}
                      className="justify-start"
                    >
                      <ToggleGroupItem 
                        value="compact" 
                        className={`rounded-full px-4 py-1 ${
                          settings.responseDetail === "compact" 
                            ? "bg-chatta-purple text-white" 
                            : "bg-transparent border border-chatta-purple/30"
                        }`}
                      >
                        Compact
                      </ToggleGroupItem>
                      <ToggleGroupItem 
                        value="balanced" 
                        className={`rounded-full px-4 py-1 ${
                          settings.responseDetail === "balanced" 
                            ? "bg-chatta-purple text-white" 
                            : "bg-transparent border border-chatta-purple/30"
                        }`}
                      >
                        Balanced
                      </ToggleGroupItem>
                      <ToggleGroupItem 
                        value="verbose" 
                        className={`rounded-full px-4 py-1 ${
                          settings.responseDetail === "verbose" 
                            ? "bg-chatta-purple text-white" 
                            : "bg-transparent border border-chatta-purple/30"
                        }`}
                      >
                        Verbose
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Tone</p>
                    <ToggleGroup 
                      type="single" 
                      value={settings.tone}
                      onValueChange={(value) => value && handleSettingChange('tone', value)}
                      className="justify-start"
                    >
                      <ToggleGroupItem 
                        value="professional" 
                        className={`rounded-full px-4 py-1 ${
                          settings.tone === "professional" 
                            ? "bg-chatta-purple text-white" 
                            : "bg-transparent border border-chatta-purple/30"
                        }`}
                      >
                        Professional
                      </ToggleGroupItem>
                      <ToggleGroupItem 
                        value="casual" 
                        className={`rounded-full px-4 py-1 ${
                          settings.tone === "casual" 
                            ? "bg-chatta-purple text-white" 
                            : "bg-transparent border border-chatta-purple/30"
                        }`}
                      >
                        Casual
                      </ToggleGroupItem>
                      <ToggleGroupItem 
                        value="meme" 
                        className={`rounded-full px-4 py-1 ${
                          settings.tone === "meme" 
                            ? "bg-chatta-purple text-white" 
                            : "bg-transparent border border-chatta-purple/30"
                        }`}
                      >
                        Meme Mode 😎
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="command-previews"
                      checked={settings.showCommandPreviews}
                      onCheckedChange={(checked) => 
                        handleSettingChange('showCommandPreviews', checked)
                      }
                      className="data-[state=checked]:bg-chatta-purple"
                    />
                    <label 
                      htmlFor="command-previews" 
                      className="text-sm cursor-pointer"
                    >
                      Show command previews
                    </label>
                  </div>
                </CardContent>
              </Card>
              
              {/* Interface Section */}
              <Card className="neo-blur">
                <CardHeader>
                  <CardTitle>Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Moon size={16} className="text-gray-400" />
                      <span>Theme</span>
                    </span>
                    <div className="bg-chatta-purple/20 border border-chatta-purple/30 rounded-full p-1 flex">
                      <button 
                        className={`rounded-full p-1.5 ${
                          settings.theme === 'dark' 
                            ? 'bg-chatta-purple text-white' 
                            : 'text-gray-400'
                        }`}
                        onClick={() => handleSettingChange('theme', 'dark')}
                      >
                        <Moon size={16} />
                      </button>
                      <button 
                        className={`rounded-full p-1.5 ${
                          settings.theme === 'light' 
                            ? 'bg-chatta-purple text-white' 
                            : 'text-gray-400'
                        }`}
                        onClick={() => handleSettingChange('theme', 'light')}
                      >
                        <Sun size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Font Size</span>
                    <div className="flex items-center border border-chatta-purple/30 rounded-full overflow-hidden">
                      <button 
                        className={`px-3 py-1 ${
                          settings.fontSize === 'small' 
                            ? 'bg-chatta-purple text-white' 
                            : 'text-gray-400'
                        }`}
                        onClick={() => handleSettingChange('fontSize', 'small')}
                      >
                        S
                      </button>
                      <button 
                        className={`px-3 py-1 ${
                          settings.fontSize === 'medium' 
                            ? 'bg-chatta-purple text-white' 
                            : 'text-gray-400'
                        }`}
                        onClick={() => handleSettingChange('fontSize', 'medium')}
                      >
                        M
                      </button>
                      <button 
                        className={`px-3 py-1 ${
                          settings.fontSize === 'large' 
                            ? 'bg-chatta-purple text-white' 
                            : 'text-gray-400'
                        }`}
                        onClick={() => handleSettingChange('fontSize', 'large')}
                      >
                        L
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Languages size={16} className="text-gray-400" />
                      <span>Language</span>
                    </span>
                    <button 
                      className="flex items-center gap-2 bg-transparent border border-chatta-purple/30 rounded-full px-4 py-1 text-sm"
                    >
                      {settings.language}
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Privacy & History Section */}
              <Card className="neo-blur">
                <CardHeader>
                  <CardTitle>Privacy & History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="save-chats"
                      checked={settings.saveChats}
                      onCheckedChange={(checked) => 
                        handleSettingChange('saveChats', checked)
                      }
                      className="data-[state=checked]:bg-chatta-purple"
                    />
                    <label 
                      htmlFor="save-chats" 
                      className="text-sm cursor-pointer"
                    >
                      Save chat history
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="use-history"
                      checked={settings.useHistory}
                      onCheckedChange={(checked) => 
                        handleSettingChange('useHistory', checked)
                      }
                      className="data-[state=checked]:bg-chatta-purple"
                    />
                    <label 
                      htmlFor="use-history" 
                      className="text-sm cursor-pointer"
                    >
                      Use history for smarter replies
                    </label>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button 
                      variant="chatta-secondary"
                      size="chatta"
                      className="gap-2"
                    >
                      <Trash2 size={16} />
                      Clear History
                    </Button>
                    
                    <Button 
                      variant="chatta-secondary"
                      size="chatta"
                      className="gap-2"
                    >
                      <Download size={16} />
                      Export My Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Notifications Section */}
              <Card className="neo-blur">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="token-alerts"
                      checked={settings.tokenAlerts}
                      onCheckedChange={(checked) => 
                        handleSettingChange('tokenAlerts', checked)
                      }
                      className="data-[state=checked]:bg-chatta-purple"
                    />
                    <label 
                      htmlFor="token-alerts" 
                      className="text-sm cursor-pointer"
                    >
                      Token price alerts
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="swap-confirmations"
                      checked={settings.swapConfirmations}
                      onCheckedChange={(checked) => 
                        handleSettingChange('swapConfirmations', checked)
                      }
                      className="data-[state=checked]:bg-chatta-purple"
                    />
                    <label 
                      htmlFor="swap-confirmations" 
                      className="text-sm cursor-pointer"
                    >
                      Swap confirmations
                    </label>
                  </div>
                </CardContent>
              </Card>
              
              {/* About / Support Section */}
              <Card className="neo-blur">
                <CardHeader>
                  <CardTitle>About / Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Version</span>
                    <span>1.0.0</span>
                  </div>
                  
                  <Separator className="bg-chatta-purple/20" />
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="chatta-secondary"
                      size="chatta"
                    >
                      Documentation
                    </Button>
                    
                    <Button 
                      variant="chatta-secondary"
                      size="chatta"
                      className="gap-2"
                    >
                      <AlertCircle size={16} />
                      Report Bug
                    </Button>
                    
                    <Button 
                      variant="chatta-secondary"
                      size="chatta"
                    >
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
