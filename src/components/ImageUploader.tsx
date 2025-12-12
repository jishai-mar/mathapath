import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export default function ImageUploader({ onImageSelected, isUploading = false, disabled = false }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onImageSelected(selectedFile);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!preview ? (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-24 border-dashed border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-muted-foreground" />
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                Take photo or upload image
              </span>
            </div>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            📸 Make sure your work is clearly visible and well-lit
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={preview}
              alt="Your handwritten work"
              className="w-full max-h-64 object-contain bg-secondary/30"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={handleClear}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            type="button"
            className="w-full"
            onClick={handleSubmit}
            disabled={isUploading || disabled}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing your work...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit for AI Analysis
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
