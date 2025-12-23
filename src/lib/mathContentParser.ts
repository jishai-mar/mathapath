// Utility functions for parsing and detecting math content in AI responses

export interface GraphDirective {
  functions: string[];
  type: 'function' | 'inequality' | 'system' | 'derivative';
}

export interface MathDetectionResult {
  hasGraph: boolean;
  graphDirectives: GraphDirective[];
  hasCalculation: boolean;
  hasGeometry: boolean;
  formulas: string[];
}

/**
 * Detects graph directives in AI response content
 * Format: [GRAPH: y=x^2-4] or [GRAPH: y=sin(x), y=cos(x)]
 */
export function parseGraphDirectives(content: string): GraphDirective[] {
  const graphRegex = /\[GRAPH:\s*([^\]]+)\]/gi;
  const directives: GraphDirective[] = [];
  
  let match;
  while ((match = graphRegex.exec(content)) !== null) {
    const functionsStr = match[1];
    const functions = functionsStr.split(',').map(f => f.trim());
    
    // Determine type based on content
    let type: GraphDirective['type'] = 'function';
    if (functionsStr.includes('>') || functionsStr.includes('<')) {
      type = 'inequality';
    } else if (functions.length > 1) {
      type = 'system';
    }
    
    directives.push({ functions, type });
  }
  
  return directives;
}

/**
 * Detects if content contains graphable mathematical expressions
 * even without explicit [GRAPH:] directives
 */
export function detectGraphableContent(content: string): string[] {
  const functions: string[] = [];
  
  // Match common function patterns in LaTeX
  const patterns = [
    // y = f(x) patterns
    /\$\$?\s*y\s*=\s*([^$]+)\s*\$\$?/gi,
    // f(x) = ... patterns
    /\$\$?\s*f\s*\(\s*x\s*\)\s*=\s*([^$]+)\s*\$\$?/gi,
    // Explicit function mentions
    /(?:graph|plot|function)\s+(?:of\s+)?(?:is\s+)?\$\$?\s*([^$]+)\s*\$\$?/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const func = match[1].trim();
      // Clean up LaTeX artifacts
      const cleaned = func
        .replace(/\\cdot/g, '*')
        .replace(/\\times/g, '*')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
        .replace(/\\sin/g, 'sin')
        .replace(/\\cos/g, 'cos')
        .replace(/\\tan/g, 'tan')
        .replace(/\\ln/g, 'ln')
        .replace(/\\log/g, 'log')
        .replace(/\^(\d)/g, '^$1')
        .replace(/\^\{([^}]+)\}/g, '^($1)');
      
      if (cleaned && !functions.includes(cleaned)) {
        functions.push(cleaned);
      }
    }
  }
  
  return functions;
}

/**
 * Analyzes AI response content for all math-related elements
 */
export function analyzeMathContent(content: string): MathDetectionResult {
  const graphDirectives = parseGraphDirectives(content);
  const detectedFunctions = detectGraphableContent(content);
  
  // Check for calculation needs
  const hasCalculation = /\$\$?[^$]*[+\-*/=][^$]*\$\$?/.test(content) ||
    content.toLowerCase().includes('calculate') ||
    content.toLowerCase().includes('compute') ||
    content.toLowerCase().includes('evaluate');
  
  // Check for geometry
  const hasGeometry = 
    content.toLowerCase().includes('triangle') ||
    content.toLowerCase().includes('angle') ||
    content.toLowerCase().includes('polygon') ||
    content.toLowerCase().includes('circle') ||
    /\[DIAGRAM:/.test(content);
  
  // Extract formulas
  const formulaRegex = /\$\$([^$]+)\$\$/g;
  const formulas: string[] = [];
  let match;
  while ((match = formulaRegex.exec(content)) !== null) {
    formulas.push(match[1]);
  }
  
  return {
    hasGraph: graphDirectives.length > 0 || detectedFunctions.length > 0,
    graphDirectives,
    hasCalculation,
    hasGeometry,
    formulas,
  };
}

/**
 * Validates LaTeX syntax for common issues
 */
export function validateLatexSyntax(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for unbalanced dollar signs
  const singleDollars = (content.match(/(?<!\$)\$(?!\$)/g) || []).length;
  if (singleDollars % 2 !== 0) {
    issues.push('Unbalanced inline math delimiters ($)');
  }
  
  const doubleDollars = (content.match(/\$\$/g) || []).length;
  if (doubleDollars % 2 !== 0) {
    issues.push('Unbalanced display math delimiters ($$)');
  }
  
  // Check for common LaTeX errors
  if (/\$[^$]*\\frac[^{]/.test(content)) {
    issues.push('\\frac should be followed by {numerator}{denominator}');
  }
  
  if (/\$[^$]*\\sqrt[^{[]/.test(content)) {
    issues.push('\\sqrt should be followed by {content} or [n]{content}');
  }
  
  // Check for ambiguous minus signs (e.g., x-2 vs x - 2)
  // This is more of a style suggestion
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Cleans and normalizes math content for display
 */
export function normalizeMathContent(content: string): string {
  return content
    // Ensure proper spacing around operators in display math
    .replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      const normalized = math
        .replace(/([^\\])([=<>])/g, '$1 $2 ')
        .replace(/\s+/g, ' ')
        .trim();
      return `$$${normalized}$$`;
    })
    // Fix common typos
    .replace(/\\squrt/g, '\\sqrt')
    .replace(/\\frac\s+/g, '\\frac');
}
