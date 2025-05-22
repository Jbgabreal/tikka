
import React, { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Plus, Minus } from "lucide-react";

const FaqSection = () => {
  // Default open first accordion item, then closed
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  
  // FAQ data
  const faqItems = [
    {
      id: "faq-1",
      question: "What is Chatta?",
      answer: "Chatta is an AI assistant built specifically for Solana. It helps you execute trades, analyze portfolios, launch tokens, and track market sentiment through a simple, conversational interface."
    },
    {
      id: "faq-2",
      question: "How much does Chatta cost?",
      answer: "Chatta offers both free and premium tiers. Basic functionality is available to all users, while premium features require a subscription or holding $CHTA tokens for enhanced access and capabilities."
    },
    {
      id: "faq-3",
      question: "What does $CHTA do?",
      answer: "The $CHTA token powers the Chatta ecosystem. Holders gain premium access tiers, governance rights, and reduced fees on transactions. You can stake $CHTA for additional benefits or use it to access advanced features."
    },
    {
      id: "faq-4",
      question: "Is there a free version?",
      answer: "Yes, Chatta offers a free tier that allows basic trades, portfolio viewing, and market information. Premium features require either a subscription or holding a certain amount of $CHTA tokens."
    },
    {
      id: "faq-5",
      question: "Do I need to connect my wallet?",
      answer: "For basic information and market insights, no wallet connection is required. However, to execute trades, view your portfolio, or perform on-chain actions, you'll need to connect your Solana wallet."
    },
    {
      id: "faq-6",
      question: "What chains does Chatta support?",
      answer: "Currently, Chatta is focused exclusively on the Solana ecosystem, optimized for its speed and efficiency. We may explore additional blockchain integrations based on community demand in the future."
    },
    {
      id: "faq-7",
      question: "Can I launch tokens using Chatta?",
      answer: "Yes! Chatta provides an intuitive interface for launching custom tokens on Solana. Through conversational AI, we guide you through tokenomics, distribution, and listing without requiring technical knowledge."
    },
    {
      id: "faq-8",
      question: "Is Chatta safe to use?",
      answer: "Chatta prioritizes security in all operations. We never store your private keys, use industry-standard encryption, and our smart contract interactions are audited. All transaction approvals remain in your control via your wallet."
    },
    {
      id: "faq-9",
      question: "Can I build on top of Chatta?",
      answer: "Absolutely! We offer a developer API that allows integration of Chatta's capabilities into your own applications. Contact our team for API access and documentation to start building on our infrastructure."
    }
  ];

  return (
    <div className="py-20 bg-chatta-dark relative">
      {/* Background gradient elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-chatta-purple/10 filter blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-chatta-cyan/10 filter blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about Chatta and how it can revolutionize your Solana experience.
          </p>
        </div>
        
        {/* FAQ accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion 
            type="single" 
            collapsible 
            value={openItem} 
            onValueChange={setOpenItem} 
            className="w-full"
          >
            {faqItems.map((item) => (
              <AccordionItem 
                key={item.id} 
                value={item.id}
                className="border-b border-gray-700 last:border-0"
              >
                <AccordionTrigger className="py-6 text-left hover:no-underline">
                  <span className="text-lg font-medium">{item.question}</span>
                  <div className="flex-shrink-0 ml-2">
                    {openItem === item.id ? (
                      <Minus className="h-5 w-5 text-chatta-purple" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="text-gray-400">{item.answer}</div>
                  
                  {/* Special content for the CHTA token FAQ item */}
                  {item.id === "faq-3" && (
                    <div className="mt-3">
                      <a 
                        href="#" 
                        className="inline-flex items-center gap-2 text-chatta-purple hover:text-chatta-purple/80 transition-colors"
                      >
                        Buy with TKNZ
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FaqSection;
