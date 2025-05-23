import React, { useRef, useEffect } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Step } from '@/types';

interface StepsListProps {
  steps: Step[];
}

export function StepsList({ steps }: StepsListProps) {
  const stepsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [steps]);

  return (
    <div className="rounded-lg p-4 h-full overflow-auto mx-8">
      <div className="absolute top-0 left-0 right-0 h-16 z-10 bg-gradient-to-b from-[#0f0f10] to-transparent pointer-events-none" />
      <h2 className="text-lg font-semibold mb-4 text-gray-100 mt-10">
        Building
        <span className="animate-pulse [animation-delay:0s]">.</span>
        <span className="animate-pulse [animation-delay:0.2s]">.</span>
        <span className="animate-pulse [animation-delay:0.4s]">.</span>
      </h2>
      <div className="space-y-4 mb-10">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors`}
          >
            <div className="flex items-center gap-2">
              {step.status === "completed" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : step.status === "in-progress" ? (
                <Clock className="w-5 h-5 text-blue-400" />
              ) : (
                <Circle className="w-5 h-5 text-gray-600" />
              )}
              <h3 className="font-medium text-gray-100">{step.title}</h3>
            </div>
            <p className="text-sm text-gray-400 mt-2">{step.description}</p>
          </div>
        ))}
        <div ref={stepsEndRef} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10 z-10 bg-gradient-to-t from-[#0f0f10] to-transparent pointer-events-none" />
    </div>
  );
}