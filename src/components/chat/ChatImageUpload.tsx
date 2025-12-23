import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatImageUploadProps {
  onImageSubmit: (imageData: string, file: File) => void;
  isUploading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export function ChatImageUpload({ onImageSubmit, isUploading, disabled, compact }: ChatImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && preview) {
      onImageSubmit(preview, selectedFile);
      handleClear();
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Toggle button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-lg transition-colors",
          isOpen && "bg-primary/10 text-primary"
        )}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        title="Upload photo of your work"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>

      {/* Preview popup */}
      {preview && isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-64 p-2 bg-card border border-border rounded-lg shadow-lg animate-in slide-in-from-bottom-2 z-10">
          <div className="relative">
            <img
              src={preview}
              alt="Your work"
              className="w-full h-40 object-contain bg-secondary/30 rounded-md"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
              onClick={handleClear}
              disabled={isUploading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isUploading || disabled}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Analyze Work
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            📸 AI will check your handwritten solution
          </p>
        </div>
      )}
    </div>
  );
}
