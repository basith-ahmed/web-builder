import React, { useRef, useEffect } from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { Step, StepType } from "@/types";

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
    <div className="rounded-lg p-4 h-full overflow-auto mx-4">
      <div className="absolute top-0 left-0 right-0 h-16 z-10 bg-gradient-to-b from-[#0f0f10] to-transparent pointer-events-none" />
      <h2 className="text-lg font-semibold mb-4 text-gray-100 mt-10 z-50">
        Building
        <span className="animate-pulse [animation-delay:0s]">.</span>
        <span className="animate-pulse [animation-delay:0.2s]">.</span>
        <span className="animate-pulse [animation-delay:0.4s]">.</span>
      </h2>
      <div className="space-y-4 mb-10">
        {steps.map((step, index) => {
          // console.log(step)
          return (
            <div
              key={index}
              className={`flex items-center w-full rounded-lg cursor-pointer transition-colors`}
            >
              {!step.description && (
                <div className="flex flex-col items-center relative ml-10">
                  {index !== 0 && (
                    <div className="w-px h-9 bg-white/20 absolute -translate-y-8" />
                  )}
                  <div
                    className={`w-2.5 h-2.5 z-20 rounded-full border-2 flex items-center justify-center
                  border-white/20 bg-[#3b3b3b]
                      `}
                  />
                </div>
              )}
              {step.description ? (
                <p className="text-white/80 w-full z-10 mt-4 mx-4 border border-white/10 rounded-2xl bg-[#1b1b1c] p-4">
                  {step.description}
                </p>
              ) : (
                <div className="flex items-center pl-2 pr-8">
                  <div className="font-medium text-white/70 max-w-60">
                    {step.type === StepType.RunScript ? (
                      <div className="flex items-center">
                        <p>Run </p>
                        <pre className="bg-[#18181b] font-mono rounded-md px-1.5 py-0.5 text-sm w-fit border border-[#27272a] ml-1.5">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    ) : (
                      <p>{step.title}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={stepsEndRef} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10  bg-gradient-to-t from-[#0f0f10] to-transparent pointer-events-none z-50" />
    </div>
  );
}
