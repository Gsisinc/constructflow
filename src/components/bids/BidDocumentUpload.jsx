import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { callAgent } from '@/services/llmService';

export default function BidDocumentUpload({ onAnalysisComplete, projectId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Please upload PDF, DOC, DOCX, or TXT files.`);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }

      setFiles(prev => [...prev, {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
        error: null
      }]);
    });
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const analyzeBidDocument = async (fileItem) => {
    try {
      setAnalyzing(true);
      setSelectedFile(fileItem);

      // Read file content
      const fileContent = await readFileAsText(fileItem.file);

      // System prompt for bid analysis
      const systemPrompt = `You are an expert bid analyst specializing in construction and low voltage systems. Your job is to analyze bid documents and extract key information that helps companies decide whether to bid on projects.

Provide structured analysis with:
1. Project name and description
2. Estimated project value/budget
3. Key requirements and scope
4. Timeline and deadlines
5. Bid submission requirements
6. Any special conditions or requirements
7. Win probability assessment (1-10)
8. Recommended action items

Always respond with valid JSON containing these exact fields: projectName, description, estimatedValue, requirements (array), timeline, bidRequirements, specialConditions, winProbability (number 1-10), actionItems (array).`;

      const userMessage = `Please analyze this bid document and extract key information. Return valid JSON only:

${fileContent}`;

      // Call AI agent to analyze bid document
      const response = await callAgent(systemPrompt, userMessage);

      // Parse response
      let parsedResult = response;
      if (typeof response === 'string') {
        try {
          parsedResult = JSON.parse(response);
        } catch (e) {
          // If not valid JSON, create structured response
          parsedResult = {
            projectName: 'Bid Document Analysis',
            description: response,
            estimatedValue: 'Not specified',
            requirements: ['See document for details'],
            timeline: 'Not specified',
            bidRequirements: 'See document for details',
            specialConditions: 'None specified',
            winProbability: 5,
            actionItems: ['Review full document', 'Assess team capacity', 'Prepare bid response']
          };
        }
      }

      setAnalysisResult(parsedResult);
      setShowAnalysisDialog(true);

      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'analyzed' }
          : f
      ));

      toast.success(`Document analyzed successfully!`);
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast.error('Failed to analyze document');
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
    } finally {
      setAnalyzing(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleCreateEstimate = () => {
    if (analysisResult && onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
      setShowAnalysisDialog(false);
      setFiles(prev => prev.filter(f => f.id !== selectedFile.id));
      setSelectedFile(null);
      setAnalysisResult(null);
      toast.success('Estimate created from bid analysis!');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Bid Documents
          </CardTitle>
          <CardDescription>
            Upload PDF, DOC, DOCX, or TXT files. AI will analyze and extract key information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, or TXT (max 10MB)</p>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded Files ({files.length})</p>
              {files.map(fileItem => (
                <div key={fileItem.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{fileItem.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(fileItem.size)}</p>
                    </div>
                  </div>

                  {fileItem.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => analyzeBidDocument(fileItem)}
                      disabled={analyzing}
                      className="gap-2 flex-shrink-0"
                    >
                      {analyzing && selectedFile?.id === fileItem.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Analyze
                        </>
                      )}
                    </Button>
                  )}

                  {fileItem.status === 'analyzed' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileItem.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {fileItem.status === 'error' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileItem.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Result Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bid Analysis Results</DialogTitle>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-4">
              {/* Project Name */}
              {analysisResult.projectName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Name</p>
                  <p className="text-lg font-semibold">{analysisResult.projectName}</p>
                </div>
              )}

              {/* Description */}
              {analysisResult.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground">{analysisResult.description}</p>
                </div>
              )}

              {/* Estimated Value */}
              {analysisResult.estimatedValue && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated Value</p>
                  <p className="text-lg font-semibold text-accent">{analysisResult.estimatedValue}</p>
                </div>
              )}

              {/* Requirements */}
              {analysisResult.requirements && analysisResult.requirements.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Key Requirements</p>
                  <ul className="space-y-1">
                    {analysisResult.requirements.map((req, idx) => (
                      <li key={idx} className="text-sm text-foreground flex gap-2">
                        <span className="text-accent">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeline */}
              {analysisResult.timeline && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                  <p className="text-sm text-foreground">{analysisResult.timeline}</p>
                </div>
              )}

              {/* Win Probability */}
              {analysisResult.winProbability && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Win Probability</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{ width: `${analysisResult.winProbability * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{analysisResult.winProbability}/10</span>
                  </div>
                </div>
              )}

              {/* Action Items */}
              {analysisResult.actionItems && analysisResult.actionItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Actions</p>
                  <ul className="space-y-1">
                    {analysisResult.actionItems.map((item, idx) => (
                      <li key={idx} className="text-sm text-foreground flex gap-2">
                        <span className="text-accent">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAnalysisDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleCreateEstimate}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Create Estimate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
