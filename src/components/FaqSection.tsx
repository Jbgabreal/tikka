
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "What is Chatta?",
    answer: "Chatta is an AI Copilot for Solana that enables you to trade, track, and explore the blockchain through a simple chat interface. It helps both beginners and experienced users navigate the Solana ecosystem with ease."
  },
  {
    question: "How much does Chatta cost?",
    answer: "Chatta offers tiered pricing plans starting from a basic free tier. Premium features are available through subscription plans, with discounts for $CHTA token holders."
  },
  {
    question: "What does $CHTA do?",
    answer: "The $CHTA token powers the Chatta ecosystem. Token holders receive benefits including discounted subscription rates, premium features, governance rights, and early access to new features."
  },
  {
    question: "Is there a free version?",
    answer: "Yes, Chatta offers a free tier with limited functionality that allows you to explore basic features. Premium features require a subscription or holding $CHTA tokens."
  },
  {
    question: "Do I need to connect my wallet?",
    answer: "While you can use basic Chatta features without connecting a wallet, connecting your Solana wallet unlocks the full functionality including trading, portfolio tracking, and $CHTA token benefits."
  },
  {
    question: "What chains does Chatta support?",
    answer: "Currently, Chatta primarily supports the Solana blockchain. We're exploring integration with additional chains and L2 solutions in our future roadmap."
  },
  {
    question: "Can I launch tokens using Chatta?",
    answer: "While Chatta doesn't directly support token launches yet, we provide insights and analytics that can help token creators. Full token launch functionality is on our roadmap for future releases."
  },
  {
    question: "Is Chatta safe to use?",
    answer: "Yes, Chatta employs industry-standard security practices to protect user data and transactions. We never store your private keys, and all sensitive data is encrypted. However, always practice good security hygiene when using any blockchain tools."
  },
  {
    question: "Can I build on top of Chatta?",
    answer: "We plan to release a developer API that will allow integration with Chatta's capabilities. Join our developer community to stay updated on our API launch and partnership opportunities."
  }
];

const FaqSection = () => {
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-chatta-dark">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Frequently Asked Questions</h2>
          <p className="text-chatta-gray text-lg">
            Everything you need to know about Chatta and $CHTA token
          </p>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-chatta-purple/20 rounded-lg bg-chatta-darker/50 overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-5 hover:no-underline">
                <span className="text-left font-medium text-white text-lg">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-chatta-gray">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FaqSection;
