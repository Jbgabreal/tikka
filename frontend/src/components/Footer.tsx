import React from "react";
import { Twitter, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-orange-500/20">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Logo and Copyright */}
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-16 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <img src="/lovable-uploads/tikka-logo-text.png.png" alt="Tikka" className="h-11 w-15 object-contain" />
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://twitter.com/soltikka"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"
            >
              <Twitter size={20} />
            </a>
            <a
              href="https://github.com/soltikka"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"
            >
              <Github size={20} />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2023 Tikka. All rights reserved. Powered by AI + SOL on Solana.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
