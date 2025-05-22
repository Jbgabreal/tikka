
import React, { useState, useEffect, useRef } from "react";

interface CounterProps {
  end: number;
  suffix: string;
  duration?: number;
}

const Counter: React.FC<CounterProps> = ({ end, suffix, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const updateCount = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      countRef.current = Math.floor(progress * end);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
    
    return () => {
      startTimeRef.current = null;
    };
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const TrustMetrics = () => {
  const metrics = [
    {
      icon: "⚡",
      value: 65,
      suffix: "K+",
      label: "TPS handled"
    },
    {
      icon: "💸",
      value: 0.00025,
      suffix: "",
      label: "avg fee"
    },
    {
      icon: "📬",
      value: 10,
      suffix: "K+",
      label: "smart chats processed"
    }
  ];

  return (
    <div className="py-24 bg-chatta-dark relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          <span className="gradient-text">Trust & Performance</span>
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
          Chatta is built on Solana's lightning-fast infrastructure to provide 
          the most responsive blockchain experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, index) => (
            <div key={index} className="glass-card rounded-xl p-6 text-center hover:glow transition-all duration-300">
              <div className="text-4xl mb-4">{metric.icon}</div>
              <div className="text-3xl md:text-4xl font-bold mb-2 gradient-text">
                {metric.value === 0.00025 ? 
                  "$0.00025" : 
                  <Counter end={metric.value} suffix={metric.suffix} />
                }
              </div>
              <p className="text-gray-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustMetrics;
