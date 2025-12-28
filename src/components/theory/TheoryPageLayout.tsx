import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bookmark, Share2, MessageCircle, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { BreadcrumbItem } from './types';

interface TheoryPageLayoutProps {
  title: string;
  subtitle: string;
  breadcrumb: BreadcrumbItem[];
  children: ReactNode;
  visualizer?: ReactNode;
  onAskGilbert?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  practiceUrl?: string;
  nextTopicUrl?: string;
  nextTopicTitle?: string;
  prevTopicUrl?: string;
}

export function TheoryPageLayout({
  title,
  subtitle,
  breadcrumb,
  children,
  visualizer,
  onAskGilbert,
  onSave,
  onShare,
  practiceUrl,
  nextTopicUrl,
  nextTopicTitle,
  prevTopicUrl,
}: TheoryPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 lg:mb-12"
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-border">/</span>}
                {item.href ? (
                  <button
                    onClick={() => navigate(item.href!)}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-primary font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Title row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground tracking-tight mb-3">
                {title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {subtitle}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSave}
                    className="gap-2 border-border/50 hover:border-border"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bookmark this topic</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShare}
                    className="gap-2 border-border/50 hover:border-border"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share this topic</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.header>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={visualizer ? 'lg:col-span-7' : 'lg:col-span-12 max-w-3xl'}
          >
            <div className="space-y-10">
              {children}
            </div>
          </motion.main>

          {/* Visualizer sidebar */}
          {visualizer && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="lg:sticky lg:top-6">
                {visualizer}
              </div>
            </motion.aside>
          )}
        </div>

        {/* Bottom navigation */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-border"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {prevTopicUrl && (
              <Button
                variant="outline"
                onClick={() => navigate(prevTopicUrl)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={onAskGilbert}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-4 h-4" />
              Ask Gilbert
            </Button>

            {practiceUrl && (
              <Button
                variant="ghost"
                onClick={() => navigate(practiceUrl)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <PenLine className="w-4 h-4" />
                Practice
              </Button>
            )}

            {nextTopicUrl && (
              <Button
                variant="default"
                onClick={() => navigate(nextTopicUrl)}
                className="gap-2"
              >
                Next Concept
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
