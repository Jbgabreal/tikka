
import { Home, User, Briefcase, FileText, MessageSquare } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function Navbar() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'How It Works', url: '#how-it-works', icon: User },
    { name: 'Features', url: '#features', icon: Briefcase },
    { name: 'Docs', url: '#docs', icon: FileText },
    { name: 'Chat', url: '/chat', icon: MessageSquare }
  ]

  return <NavBar items={navItems} className="sm:top-6" />
}

export default Navbar;
