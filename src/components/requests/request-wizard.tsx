import { useState, ReactNode, Children, isValidElement, cloneElement } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Save,
  Send,
} from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface RequestWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
  children: ReactNode;
  className?: string;
}

export function RequestWizard({
  steps,
  currentStep,
  onStepChange,
  onSaveDraft,
  onSubmit,
  isSubmitting = false,
  isSaving = false,
  children,
  className,
}: RequestWizardProps) {
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const childrenArray = Children.toArray(children);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Step {currentStep + 1} of {totalSteps}: {steps[currentStep]?.title}
              </CardTitle>
              {steps[currentStep]?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {steps[currentStep].description}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              {progress.toFixed(0)}% complete
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Step indicators */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (idx < currentStep) onStepChange(idx);
              }}
              disabled={idx > currentStep}
              className={cn(
                "flex items-center gap-2 text-xs font-medium transition-colors",
                isActive && "text-gold",
                isCompleted && "text-emerald-600 cursor-pointer hover:text-emerald-700",
                !isActive && !isCompleted && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                  isActive && "border-gold bg-gold text-gold-foreground",
                  isCompleted && "border-emerald-500 bg-emerald-50 text-emerald-600",
                  !isActive && !isCompleted && "border-muted-foreground/30"
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span className="hidden lg:inline">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {childrenArray[currentStep] || children}
        </CardContent>
        <Separator />
        <CardFooter className="flex items-center justify-between py-4">
          <Button
            variant="outline"
            onClick={() => onStepChange(currentStep - 1)}
            disabled={isFirstStep}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {onSaveDraft && (
              <Button
                variant="outline"
                onClick={onSaveDraft}
                disabled={isSaving || isSubmitting}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Draft
              </Button>
            )}

            {isLastStep ? (
              onSubmit && (
                <Button onClick={onSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Submit
                </Button>
              )
            ) : (
              <Button onClick={() => onStepChange(currentStep + 1)}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}