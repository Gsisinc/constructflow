import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

import PlanUploadStep from '@/components/estimator/PlanUploadStep';
import ProjectMetadataStep from '@/components/estimator/ProjectMetadataStep';
import SymbolReviewStep from '@/components/estimator/SymbolReviewStep';
import PricingConfigStep from '@/components/estimator/PricingConfigStep';
import BidPreviewStep from '@/components/estimator/BidPreviewStep';

const STORAGE_KEY = 'gsis_estimator_draft';

export default function EstimatorWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(() => {
    try { return parseInt(sessionStorage.getItem(STORAGE_KEY + '_step') || '0', 10); } catch { return 0; }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimateData, setEstimateData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      planFile: null,
      planScale: null,
      projectName: '',
      projectAddress: '',
      gcName: '',
      location: 'in-state',
      specFiles: [],
      notes: '',
      symbols: {},
      devices: [],
      scopes: {},
      prices: {},
      cables: {},
      labor: {},
      materials: [],
    };
  });

  // Persist draft to sessionStorage whenever data or step changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(estimateData));
      sessionStorage.setItem(STORAGE_KEY + '_step', String(currentStep));
    } catch {}
  }, [estimateData, currentStep]);

  const steps = [
    { title: 'Upload Plans', icon: Upload, component: PlanUploadStep },
    { title: 'Project Info', icon: AlertCircle, component: ProjectMetadataStep },
    { title: 'Review Symbols', icon: Check, component: SymbolReviewStep },
    { title: 'Pricing', icon: AlertCircle, component: PricingConfigStep },
    { title: 'Preview & Export', icon: Check, component: BidPreviewStep },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const handleStepComplete = useCallback(async (stepData) => {
    setEstimateData(prev => ({ ...prev, ...stepData }));

    // If moving to next step that requires processing, process first
    if (currentStep === 0 && stepData.planFile) {
      // Process plan document (extract scale, detect symbols, devices)
      setIsProcessing(true);
      try {
        const result = await base44.functions.invoke('processPlanDocument', {
          planFileUrl: stepData.planFile.url,
          manualScale: stepData.planScale,
          specs: stepData.specFiles || [],
        });

        if (result.data.error) {
          toast.error(`Plan processing failed: ${result.data.error}`);
          setIsProcessing(false);
          return;
        }

        setEstimateData(prev => ({
          ...prev,
          ...stepData,
          symbols: result.data.symbolMap || {},
          devices: result.data.detectedDevices || [],
          scopes: result.data.detectedScopes || {},
          cables: result.data.cableRuns || {},
        }));

        setCurrentStep(prev => prev + 1);
      } catch (error) {
        toast.error(`Error processing plan: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Normal step progression
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [currentStep]);

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFinish = async () => {
    try {
      setIsProcessing(true);

      // Generate bid documents for all detected scopes
      const result = await base44.functions.invoke('generateBidDocuments', {
        estimateData: {
          ...estimateData,
          projectName: estimateData.projectName,
          projectAddress: estimateData.projectAddress,
          gcName: estimateData.gcName,
          location: estimateData.location,
        },
      });

      if (result.data.error) {
        toast.error(`Bid generation failed: ${result.data.error}`);
        return;
      }

      toast.success('Bid documents generated successfully!');
      
      // Store estimate in database
      const estimate = await base44.entities.BidOpportunity.create({
        title: estimateData.projectName,
        project_name: estimateData.projectName,
        client_name: estimateData.gcName,
        location: estimateData.projectAddress,
        status: 'estimating',
        marked_up_plan_url: result.data.markedUpPlanUrl,
        bid_documents: result.data.bidDocumentUrls,
        bom_csv_url: result.data.bomCsvUrl,
        estimate_data_json: JSON.stringify(estimateData),
      });

      toast.success('Estimate saved!');
      navigate(`/estimate/${estimate.id}`);
    } catch (error) {
      toast.error(`Error saving estimate: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">GSIS Estimator</h1>
          <p className="text-slate-600">Professional low voltage construction estimating</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div className="mb-8">
          <div className="flex justify-between items-center gap-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isComplete = idx < currentStep;
              return (
                <div key={idx} className="flex-1 flex items-center">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: isActive ? 1.05 : 1 }}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isComplete
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isComplete ? <Check className="w-6 h-6" /> : <StepIcon className="w-5 h-5" />}
                  </motion.div>
                  <div className={`ml-3 hidden sm:block text-sm font-medium ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                    {step.title}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-1 ml-3 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-slate-50">
                <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-slate-600">Processing your plan...</p>
                  </div>
                ) : (
                  <CurrentStepComponent
                    data={estimateData}
                    onComplete={handleStepComplete}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mt-8 gap-4"
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isProcessing}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleFinish}
              disabled={isProcessing}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Bids
                  <Check className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (currentStep === 0) {
                  // Will be handled by step component
                } else {
                  setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
                }
              }}
              disabled={isProcessing}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}