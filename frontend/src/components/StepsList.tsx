import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Step } from '@/types';

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function StepsList({ steps, currentStep, onStepClick }: StepsListProps) {
  return (
    <div className="rounded-lg p-4 h-full overflow-auto ">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 z-10 bg-gradient-to-b from-black/80 to-transparent" />
      <h2 className="text-lg font-semibold mb-4 text-gray-100">Build Steps</h2>
      <div className="space-y-4 mb-20">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
              currentStep === step.id
                ? "bg-white/30 border border-white/20"
                : "hover:bg-white/20"
            }`}
            onClick={() => onStepClick(step.id)}
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
      </div>
    </div>
  );
}