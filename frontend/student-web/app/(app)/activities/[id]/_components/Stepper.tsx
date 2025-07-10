import { Check } from 'lucide-react';

export interface Step {
  title: string;
  value?: string;
}

export interface StepperProps {
  steps: Step[];
  direction?: 'horizontal' | 'vertical';
  completedSteps: number[]; // list step ที่เสร็จแล้ว (1-based indices)
}

export default function Stepper({
  steps,
  direction = 'horizontal',
  completedSteps,
}: StepperProps) {
  return (
    <div
      className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} relative`}
    >
      {steps.map((step, i) => {
        const stepIndex = i + 1;
        const isCompleted = completedSteps.includes(stepIndex);

        return (
          <div
            key={i}
            className={`relative flex ${
              direction === 'horizontal'
                ? 'flex-col items-center w-36'
                : 'flex-row items-center mb-8'
            }`}
          >
            {/* Connecting Line */}
            {i !== 0 && (
              <div
                className={`absolute ${
                  direction === 'horizontal'
                    ? 'top-[20px] -left-1/2 w-full h-[3px]'
                    : 'left-[20px] -top-10 h-full w-[3px]'
                }
                ${isCompleted ? 'bg-green-600' : 'bg-slate-200'}
                z-0`}
              />
            )}

            {/* Circle */}
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-white relative z-10
              ${isCompleted ? 'bg-green-600' : 'bg-slate-700'}
            `}
            >
              {isCompleted ? <Check size={20} /> : stepIndex}
            </div>

            {/* Step Label */}
            <div
              className={`${direction === 'horizontal' ? 'mt-2 text-center' : 'ml-4 flex flex-col'}`}
            >
              <span className="font-bold text-sm">{step.title}</span>
              {step.value && (
                <span className="text-xs text-gray-500">{step.value}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
