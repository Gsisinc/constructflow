import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Upload, Check, AlertCircle, Loader2, Menu, X,
  LayoutDashboard, Plus, Archive, TrendingUp, Settings, FileText, Download
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-slate-900 text-white overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center text-sm">G</div>
            GSIS
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { icon: LayoutDashboard, label: 'Dashboard' },
            { icon: Plus, label: 'New Bid', active: true },
            { icon: Archive, label: 'Active Projects' },
            { icon: TrendingUp, label: 'Bid History' },
            { icon: FileText, label: 'Material Pricing' },
            { icon: Upload, label: 'Supplier Integrations' },
            { icon: FileText, label: 'Reports' },
            { icon: Settings, label: 'Settings' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">GSIS Estimator</h1>
              <p className="text-xs text-slate-500">Low voltage construction estimating</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">K</div>
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          {/* Left: Main Wizard */}
          <div className="flex-1 overflow-y-auto">
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
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-slate-200">
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

            {/* Navigation */}
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
                  onClick={() => {
                    if (currentStep === 0) {
                      // Handled by step component
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

          {/* Right: Summary Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 overflow-y-auto"
          >
            <Card className="border-slate-200 sticky top-0">
              <CardHeader>
                <CardTitle className="text-lg">Bid Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                {estimateData.projectName && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-slate-900">Hillview Elementary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Location</span>
                        <span className="font-medium">Alameda, CA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Material Markup %</span>
                        <span className="font-medium">$854,200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Profit Margin %</span>
                        <span className="font-medium">$125,800</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Labor Rate</span>
                        <span className="font-medium">Hourly</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scopes */}
                {Object.keys(estimateData.scopes || {}).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 mb-2">Detected Scopes</h3>
                    <div className="space-y-2">
                      {Object.keys(estimateData.scopes).map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Options */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Generate PDF
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <FileText className="w-4 h-4" />
                    View Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}