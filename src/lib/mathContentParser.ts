// Utility functions for parsing and detecting math content in AI responses

export interface GraphDirective {
  functions: string[];
  type: 'function' | 'inequality' | 'system' | 'derivative';
  highlight?: string[];
}

export interface CalculateDirective {
  expression: string;
}

export interface GeometryDirective {
  shape: string;
  description?: string;
}

export interface DiagramDirective {
  type: string;
  description?: string;
}

export interface NumberLineDirective {
  min: number;
  max: number;
  points: number[];
  labels?: string[];
}

export interface FormulaTableDirective {
  topic: string;
}

export interface MathDetectionResult {
  hasGraph: boolean;
  graphDirectives: GraphDirective[];
  hasCalculation: boolean;
  calculateDirectives: CalculateDirective[];
  hasGeometry: boolean;
  geometryDirectives: GeometryDirective[];
  hasDiagram: boolean;
  diagramDirectives: DiagramDirective[];
  hasNumberLine: boolean;
  numberLineDirectives: NumberLineDirective[];
  hasFormulaTable: boolean;
  formulaTableDirectives: FormulaTableDirective[];
  formulas: string[];
}

/**
 * Detects graph directives in AI response content
 * Format: [GRAPH: y=x^2-4] or [GRAPH: y=x^2-4, highlight: vertex, roots]
 */
export function parseGraphDirectives(content: string): GraphDirective[] {
  const graphRegex = /\[GRAPH:\s*([^\]]+)\]/gi;
  const directives: GraphDirective[] = [];
  
  let match;
  while ((match = graphRegex.exec(content)) !== null) {
    const fullMatch = match[1];
    
    // Check for highlight parameter
    const highlightMatch = fullMatch.match(/highlight:\s*([^,\]]+(?:,\s*[^,\]]+)*)/i);
    const highlight = highlightMatch 
      ? highlightMatch[1].split(',').map(h => h.trim())
      : undefined;
    
    // Extract functions (everything before "highlight:" or all if no highlight)
    const functionsStr = highlightMatch 
      ? fullMatch.substring(0, fullMatch.toLowerCase().indexOf('highlight:')).trim().replace(/,\s*$/, '')
      : fullMatch;
    
    const functions = functionsStr.split(',').map(f => f.trim()).filter(f => f && !f.toLowerCase().startsWith('highlight'));
    
    // Determine type based on content
    let type: GraphDirective['type'] = 'function';
    if (functionsStr.includes('>') || functionsStr.includes('<')) {
      type = 'inequality';
    } else if (functions.length > 1) {
      type = 'system';
    } else if (functionsStr.includes("'") || functionsStr.toLowerCase().includes('derivative')) {
      type = 'derivative';
    }
    
    if (functions.length > 0) {
      directives.push({ functions, type, highlight });
    }
  }
  
  return directives;
}

/**
 * Parses [CALCULATE: expression] directives
 */
export function parseCalculateDirectives(content: string): CalculateDirective[] {
  const calcRegex = /\[CALCULATE:\s*([^\]]+)\]/gi;
  const directives: CalculateDirective[] = [];
  
  let match;
  while ((match = calcRegex.exec(content)) !== null) {
    directives.push({ expression: match[1].trim() });
  }
  
  return directives;
}

/**
 * Parses [GEOMETRY: shape] directives
 */
export function parseGeometryDirectives(content: string): GeometryDirective[] {
  const geoRegex = /\[GEOMETRY:\s*([^\]]+)\]/gi;
  const directives: GeometryDirective[] = [];
  
  let match;
  while ((match = geoRegex.exec(content)) !== null) {
    const value = match[1].trim();
    directives.push({ 
      shape: value.split(',')[0].trim(),
      description: value.includes(',') ? value.split(',').slice(1).join(',').trim() : undefined
    });
  }
  
  return directives;
}

/**
 * Parses [DIAGRAM: type] directives
 */
export function parseDiagramDirectives(content: string): DiagramDirective[] {
  const diagRegex = /\[DIAGRAM:\s*([^\]]+)\]/gi;
  const directives: DiagramDirective[] = [];
  
  let match;
  while ((match = diagRegex.exec(content)) !== null) {
    const value = match[1].trim();
    directives.push({ 
      type: value.split(',')[0].trim(),
      description: value.includes(',') ? value.split(',').slice(1).join(',').trim() : undefined
    });
  }
  
  return directives;
}

/**
 * Parses [NUMBER-LINE: min=-5, max=5, points=[2, -1]] directives
 */
export function parseNumberLineDirectives(content: string): NumberLineDirective[] {
  const nlRegex = /\[NUMBER-LINE:\s*([^\]]+)\]/gi;
  const directives: NumberLineDirective[] = [];
  
  let match;
  while ((match = nlRegex.exec(content)) !== null) {
    const value = match[1];
    
    const minMatch = value.match(/min\s*=\s*(-?\d+(?:\.\d+)?)/i);
    const maxMatch = value.match(/max\s*=\s*(-?\d+(?:\.\d+)?)/i);
    const pointsMatch = value.match(/points\s*=\s*\[([^\]]+)\]/i);
    const labelsMatch = value.match(/labels\s*=\s*\[([^\]]+)\]/i);
    
    if (minMatch && maxMatch && pointsMatch) {
      directives.push({
        min: parseFloat(minMatch[1]),
        max: parseFloat(maxMatch[1]),
        points: pointsMatch[1].split(',').map(p => parseFloat(p.trim())),
        labels: labelsMatch ? labelsMatch[1].split(',').map(l => l.trim().replace(/['"]/g, '')) : undefined
      });
    }
  }
  
  return directives;
}

/**
 * Parses [FORMULA-TABLE: topic] directives
 */
export function parseFormulaTableDirectives(content: string): FormulaTableDirective[] {
  const ftRegex = /\[FORMULA-TABLE:\s*([^\]]+)\]/gi;
  const directives: FormulaTableDirective[] = [];
  
  let match;
  while ((match = ftRegex.exec(content)) !== null) {
    directives.push({ topic: match[1].trim().toLowerCase() });
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
  const calculateDirectives = parseCalculateDirectives(content);
  const geometryDirectives = parseGeometryDirectives(content);
  const diagramDirectives = parseDiagramDirectives(content);
  const numberLineDirectives = parseNumberLineDirectives(content);
  const formulaTableDirectives = parseFormulaTableDirectives(content);
  const detectedFunctions = detectGraphableContent(content);
  
  // Check for calculation needs
  const hasCalculation = calculateDirectives.length > 0 ||
    /\$\$?[^$]*[+\-*/=][^$]*\$\$?/.test(content) ||
    content.toLowerCase().includes('calculate') ||
    content.toLowerCase().includes('compute') ||
    content.toLowerCase().includes('evaluate');
  
  // Check for geometry
  const hasGeometry = geometryDirectives.length > 0 ||
    content.toLowerCase().includes('triangle') ||
    content.toLowerCase().includes('angle') ||
    content.toLowerCase().includes('polygon') ||
    content.toLowerCase().includes('circle');
  
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
    calculateDirectives,
    hasGeometry,
    geometryDirectives,
    hasDiagram: diagramDirectives.length > 0,
    diagramDirectives,
    hasNumberLine: numberLineDirectives.length > 0,
    numberLineDirectives,
    hasFormulaTable: formulaTableDirectives.length > 0,
    formulaTableDirectives,
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

/**
 * Strips all visual directives from content for clean text display
 */
export function stripDirectives(content: string): string {
  return content
    .replace(/\[GRAPH:[^\]]+\]/gi, '')
    .replace(/\[CALCULATE:[^\]]+\]/gi, '')
    .replace(/\[GEOMETRY:[^\]]+\]/gi, '')
    .replace(/\[DIAGRAM:[^\]]+\]/gi, '')
    .replace(/\[NUMBER-LINE:[^\]]+\]/gi, '')
    .replace(/\[FORMULA-TABLE:[^\]]+\]/gi, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
