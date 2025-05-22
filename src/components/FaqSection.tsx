
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "What is Chatta?",
    answer: "Chatta is your Solana-native AI assistant. It lets you swap tokens, launch meme coins, track market sentiment, and analyze your portfolio — all through natural chat commands."
  },
  {
    question: "How much does Chatta cost?",
    answer: "Chatta will be free for the first 24 hours after launch. After that, you'll need to hold $CHTA (Chatta's native token) to access core features."
  },
  {
    question: "What does $CHTA do?",
    answer: "Holding $CHTA gives you real utility:\n\n• Unlocks core AI features like swaps, token creation, and analytics\n\n• Grants early access to upcoming tools and private models\n\n• Enables reduced fees on onchain transactions\n\n• Allows you to vote on new features through governance"
  },
  {
    question: "Is there a free version?",
    answer: "Yes — but only during the initial 24-hour launch window. After that, core features will require a $CHTA balance. We want to reward early adopters and real users."
  },
  {
    question: "Do I need to connect my wallet?",
    answer: "Yes, to use Chatta for onchain actions, you'll need to connect your Solana wallet. We are non-custodial — Chatta never asks for your seed phrase or holds your funds."
  },
  {
    question: "What chains does Chatta support?",
    answer: "Only Solana. We're optimized for fast, low-fee execution and deep integration within the Solana ecosystem."
  },
  {
    question: "Can I launch tokens using Chatta?",
    answer: "Yes. Just say something like: Launch a meme token called BONKAI with 1B supply — and Chatta handles the rest."
  },
  {
    question: "Is Chatta safe to use?",
    answer: "Chatta is non-custodial and only performs transactions when you approve them in your wallet. You're always in control."
  },
  {
    question: "Can I build on top of Chatta?",
    answer: "We're building a developer layer with custom plugins and skill extensions. Join early to experiment and build with our API + tools."
  }
];

const FaqSection = () => {
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-chatta-dark">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Frequently Asked Questions</h2>
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
              <AccordionContent className="px-6 pb-5 text-chatta-gray whitespace-pre-line">
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
