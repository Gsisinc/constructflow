import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Upload, Check, AlertCircle, Loader2,
  LayoutDashboard, Plus, Archive, TrendingUp, FileText, Download, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

import PlanUploadStep from '@/components/estimator/PlanUploadStep';
import ProjectMetadataStep from '@/components/estimator/ProjectMetadataStep';
import SymbolReviewStep from '@/components/estimator/SymbolReviewStep';
import PricingConfigStep from '@/components/estimator/PricingConfigStep';
import BidPreviewStep from '@/components/estimator/BidPreviewStep';

export default function EstimatorWizard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('estimator');
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimateData, setEstimateData] = useState({
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
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'estimator', label: 'Estimator', icon: Plus },
    { id: 'projects', label: 'Active Projects', icon: Archive },
    { id: 'history', label: 'Bid History', icon: TrendingUp },
    { id: 'pricing', label: 'Material Pricing', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

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

    if (currentStep === 0 && stepData.planFile) {
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
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [currentStep]);

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFinish = async () => {
    try {
      setIsProcessing(true);

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
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-40"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">G</div>
            <h1 className="text-xl font-bold text-slate-900">GSIS Estimator</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">K</div>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border-b border-slate-200 px-6 sticky top-16 z-30"
      >
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'estimator') setCurrentStep(0);
                }}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'estimator' ? (
            <motion.div
              key="estimator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                {/* Step Title */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6"
                >
                  <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep].title}</h2>
                  {currentStep === 0 && <p className="text-slate-600 text-sm mt-1">Start by uploading your project plans</p>}
                </motion.div>

                {/* Step Content */}
                <Card className="border-slate-200 mb-6">
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

                {/* Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-between items-center gap-4"
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
                      className="gap-2 bg-orange-500 hover:bg-orange-600"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Generate Bids
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="other"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <p className="text-slate-600 text-lg">Coming soon: {tabs.find(t => t.id === activeTab)?.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}