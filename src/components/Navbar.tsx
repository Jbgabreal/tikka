
import { Home, User, Briefcase, FileText, MessageSquare, ExternalLink } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'How It Works', url: '#how-it-works', icon: User },
    { name: 'Features', url: '#features', icon: Briefcase },
    { name: 'Docs', url: '#docs', icon: FileText },
    { name: 'Chat', url: '/chat', icon: MessageSquare }
  ]

  return (
    <div className="relative">
      <NavBar items={navItems} className="sm:top-6" />
      <div className="fixed top-6 right-6 z-50 hidden sm:block">
        <Button className="bg-chatta-purple hover:bg-chatta-purple/90 glow text-white rounded-full">
          <ExternalLink size={18} className="mr-2" />
          Launch App
        </Button>
      </div>
    </div>
  )
}

export default Navbar;
