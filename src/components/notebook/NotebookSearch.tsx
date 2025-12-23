import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NotebookSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function NotebookSearch({ value, onChange }: NotebookSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search by keyword, topic, or content..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => onChange('')}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
