import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqSection = () => {
  const faqs = [
    {
      question: "What is Tikka?",
      answer: "Tikka is an AI-powered command line for Solana that lets you interact with the blockchain using natural language. You can swap tokens, launch projects, track sentiment, and manage portfolios all through simple chat commands."
    },
    {
      question: "How much does Tikka cost?",
      answer: "Tikka offers both free and premium tiers. The free version includes basic chat functionality and limited swaps. Premium features include unlimited swaps, advanced analytics, and priority support."
    },
    {
      question: "What does $CHAT do?",
      answer: "$TIKKA is the native token of the Tikka ecosystem. It provides governance rights, staking rewards, and access to premium features. Token holders can vote on platform upgrades and earn rewards for participating in the ecosystem."
    },
    {
      question: "Is there a free version?",
      answer: "Yes! Tikka offers a free tier that includes basic chat functionality, limited token swaps, and access to market data. You can upgrade to premium for unlimited features and advanced analytics."
    },
    {
      question: "Do I need to connect my wallet?",
      answer: "Yes, you'll need to connect your Solana wallet to execute transactions. Tikka supports all major Solana wallets including Phantom, Solflare, and Backpack. Your private keys never leave your wallet."
    },
    {
      question: "What chains does Chatta support?",
      answer: "Currently, Tikka is built exclusively for Solana. We chose Solana for its speed, low fees, and growing ecosystem. Future versions may support additional chains."
    },
    {
      question: "Can I launch tokens using Chatta?",
      answer: "Yes! Tikka makes it easy to launch new tokens on Solana. Simply describe your token idea in natural language, and Tikka will guide you through the creation process including tokenomics, distribution, and liquidity provision."
    },
    {
      question: "Is Chatta safe to use?",
      answer: "Absolutely. Tikka uses industry-standard security practices and never has access to your private keys. All transactions are executed through your connected wallet, and we use audited smart contracts for all operations."
    },
    {
      question: "Can I build on top of Chatta?",
      answer: "Yes! Tikka provides APIs and SDKs for developers who want to integrate our AI capabilities into their own applications. Contact us for developer documentation and partnership opportunities."
    }
  ];

  return (
    <section id="faq" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about Tikka and how to get started.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="neo-card rounded-xl border border-orange-500/20"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
