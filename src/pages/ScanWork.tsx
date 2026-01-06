import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Camera, Upload, X, Loader2, ScanLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ScanResultCard, { ScanResult } from '@/components/scan/ScanResultCard';

export default function ScanWork() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-general-work', {
        body: {
          imageBase64: preview,
          problemDescription: problemDescription || undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as ScanResult);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your work. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScanAgain = () => {
    handleClear();
    setProblemDescription('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Scan Your Work</h1>
            <p className="text-muted-foreground text-sm">
              Take a photo of your handwritten work for instant feedback
            </p>
          </div>
        </div>

        {/* Show result if available */}
        {result ? (
          <ScanResultCard result={result} onScanAgain={handleScanAgain} />
        ) : (
          <>
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ScanLine className="w-5 h-5" />
                  Upload Your Work
                </CardTitle>
                <CardDescription>
                  Take a clear photo of your handwritten math work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!preview ? (
                  <Button
                    variant="outline"
                    className="w-full h-40 border-dashed border-2 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-4">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">
                        Take photo or upload image
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={preview}
                      alt="Your handwritten work"
                      className="w-full max-h-80 object-contain bg-muted/30"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={handleClear}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  📸 Make sure your work is clearly visible and well-lit
                </p>
              </CardContent>
            </Card>

            {/* Optional Description */}
            {preview && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What problem are you solving? (optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g., Solve for x: 2x + 5 = 13"
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Adding context helps the AI give better feedback
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Analyze Button */}
            {preview && (
              <Button
                className="w-full h-12 text-lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing your work...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-5 h-5 mr-2" />
                    Check My Work
                  </>
                )}
              </Button>
            )}

            {/* Tips */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-3">Tips for best results:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span>✏️</span>
                    <span>Write clearly with dark ink or pencil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>💡</span>
                    <span>Ensure good lighting with no shadows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📐</span>
                    <span>Keep the camera straight above your work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📝</span>
                    <span>Show all your working steps, not just the answer</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
