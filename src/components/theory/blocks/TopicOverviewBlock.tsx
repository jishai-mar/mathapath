import { cn } from '@/lib/utils';
import { TheoryMathRenderer } from '../TheoryMathRenderer';

interface TheorySection {
  heading: string;
  content: string[];
  examples?: TheoryExample[];
  rules?: string[];
  mistakes?: TheMistake[];
}

interface TheoryExample {
  problem: string;
  steps: string[];
  result?: string;
}

interface TheMistake {
  mistake: string;
  why: string;
}

interface TopicOverviewContent {
  introduction?: string;
  sections: TheorySection[];
}

interface TopicOverviewBlockProps {
  block: {
    id: string;
    title: string;
    content: TopicOverviewContent;
  };
}

export function TopicOverviewBlock({ block }: TopicOverviewBlockProps) {
  const { content } = block;

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      {/* Introduction */}
      {content.introduction && (
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          {content.introduction}
        </p>
      )}

      {/* Sections */}
      <div className="space-y-10">
        {content.sections.map((section, idx) => (
          <section key={idx} className="scroll-mt-24">
            {/* Section heading */}
            <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
              {section.heading}
            </h2>

            {/* Content paragraphs */}
            <div className="space-y-3 mb-6">
              {section.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="text-foreground/90 leading-relaxed">
                  <TheoryMathRenderer content={paragraph} />
                </p>
              ))}
            </div>

            {/* Rules (highlighted) */}
            {section.rules && section.rules.length > 0 && (
              <div className="space-y-3 mb-6">
                {section.rules.map((rule, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg"
                  >
                    <p className="font-medium text-foreground">
                      <TheoryMathRenderer content={rule} />
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Worked examples */}
            {section.examples && section.examples.length > 0 && (
              <div className="space-y-4 mb-6">
                {section.examples.map((example, eIdx) => (
                  <div
                    key={eIdx}
                    className="bg-muted/30 border border-border rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Example {section.examples!.length > 1 ? eIdx + 1 : ''}
                      </span>
                    </div>
                    
                    {/* Problem */}
                    <p className="font-medium text-foreground mb-4">
                      <TheoryMathRenderer content={example.problem} />
                    </p>

                    {/* Steps */}
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {example.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex gap-3">
                          <span className="text-xs font-medium text-muted-foreground mt-1">
                            {sIdx + 1}.
                          </span>
                          <p className="text-foreground/90">
                            <TheoryMathRenderer content={step} />
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Result */}
                    {example.result && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="font-medium text-primary">
                          <TheoryMathRenderer content={example.result} />
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Common mistakes */}
            {section.mistakes && section.mistakes.length > 0 && (
              <div className="space-y-3">
                {section.mistakes.map((mistake, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
                  >
                    <div className="font-medium text-destructive mb-2 flex items-start gap-2">
                      <span>✗</span>
                      <TheoryMathRenderer content={mistake.mistake} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <TheoryMathRenderer content={mistake.why} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
