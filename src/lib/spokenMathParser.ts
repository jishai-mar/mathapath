/**
 * Spoken Math Parser
 * Converts verbal math expressions to mathematical notation and vice versa
 */

// Word-to-symbol mappings for parsing spoken math
const numberWords: Record<string, string> = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
  'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
  'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
  'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
  'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000',
  'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
};

const operatorPatterns: Array<{ pattern: RegExp; replacement: string }> = [
  // Exponents
  { pattern: /(\w+)\s*squared/gi, replacement: '$1²' },
  { pattern: /(\w+)\s*cubed/gi, replacement: '$1³' },
  { pattern: /(\w+)\s*to the power of\s*(\w+)/gi, replacement: '$1^$2' },
  { pattern: /(\w+)\s*to the\s*(\w+)\s*(power|th)/gi, replacement: '$1^$2' },
  { pattern: /square root of\s*(\w+)/gi, replacement: '√$1' },
  { pattern: /sqrt of\s*(\w+)/gi, replacement: '√$1' },
  { pattern: /cube root of\s*(\w+)/gi, replacement: '∛$1' },
  
  // Basic operations
  { pattern: /\bplus\b/gi, replacement: '+' },
  { pattern: /\bminus\b/gi, replacement: '-' },
  { pattern: /\btimes\b/gi, replacement: '×' },
  { pattern: /\bmultiplied by\b/gi, replacement: '×' },
  { pattern: /\bdivided by\b/gi, replacement: '÷' },
  { pattern: /\bover\b/gi, replacement: '/' },
  { pattern: /\bequals\b/gi, replacement: '=' },
  { pattern: /\bis equal to\b/gi, replacement: '=' },
  
  // Fractions
  { pattern: /(\w+)\s*over\s*(\w+)/gi, replacement: '$1/$2' },
  { pattern: /one half/gi, replacement: '1/2' },
  { pattern: /one third/gi, replacement: '1/3' },
  { pattern: /one fourth/gi, replacement: '1/4' },
  { pattern: /one quarter/gi, replacement: '1/4' },
  { pattern: /two thirds/gi, replacement: '2/3' },
  { pattern: /three fourths/gi, replacement: '3/4' },
  { pattern: /three quarters/gi, replacement: '3/4' },
  
  // Parentheses
  { pattern: /\bopen (parenthesis|bracket|paren)\b/gi, replacement: '(' },
  { pattern: /\bclose (parenthesis|bracket|paren)\b/gi, replacement: ')' },
  { pattern: /\bleft (parenthesis|bracket|paren)\b/gi, replacement: '(' },
  { pattern: /\bright (parenthesis|bracket|paren)\b/gi, replacement: ')' },
  
  // Comparisons
  { pattern: /\bless than\b/gi, replacement: '<' },
  { pattern: /\bgreater than\b/gi, replacement: '>' },
  { pattern: /\bless than or equal to\b/gi, replacement: '≤' },
  { pattern: /\bgreater than or equal to\b/gi, replacement: '≥' },
  { pattern: /\bnot equal to\b/gi, replacement: '≠' },
  
  // Special values
  { pattern: /\bpi\b/gi, replacement: 'π' },
  { pattern: /\binfinity\b/gi, replacement: '∞' },
  { pattern: /\bnegative\s+(\w+)/gi, replacement: '-$1' },
  { pattern: /\bpositive\s+(\w+)/gi, replacement: '+$1' },
  
  // Trigonometry
  { pattern: /\bsine of\s*/gi, replacement: 'sin(' },
  { pattern: /\bcosine of\s*/gi, replacement: 'cos(' },
  { pattern: /\btangent of\s*/gi, replacement: 'tan(' },
  { pattern: /\barcsin of\s*/gi, replacement: 'arcsin(' },
  { pattern: /\barccos of\s*/gi, replacement: 'arccos(' },
  { pattern: /\barctan of\s*/gi, replacement: 'arctan(' },
  
  // Logarithms
  { pattern: /\blog of\s*/gi, replacement: 'log(' },
  { pattern: /\bnatural log of\s*/gi, replacement: 'ln(' },
  { pattern: /\bln of\s*/gi, replacement: 'ln(' },
  { pattern: /\be to the\s*(\w+)/gi, replacement: 'e^$1' },
];

/**
 * Converts spoken math expressions to mathematical notation
 * Example: "two x squared plus three x equals zero" → "2x² + 3x = 0"
 */
export function normalizeSpokenMath(speech: string): string {
  if (!speech) return speech;
  
  let result = speech.toLowerCase();
  
  // Replace number words with digits
  for (const [word, digit] of Object.entries(numberWords)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, digit);
  }
  
  // Apply operator patterns
  for (const { pattern, replacement } of operatorPatterns) {
    result = result.replace(pattern, replacement);
  }
  
  // Clean up spacing around operators
  result = result.replace(/\s*([+\-×÷=<>≤≥≠^])\s*/g, ' $1 ');
  result = result.replace(/\s+/g, ' ').trim();
  
  // Handle implicit multiplication (e.g., "2 x" → "2x")
  result = result.replace(/(\d)\s+([a-z])/gi, '$1$2');
  
  return result;
}

/**
 * Converts mathematical notation to spoken form for TTS
 * Example: "2x² + 3x = 0" → "two x squared plus three x equals zero"
 */
export function mathToSpoken(expression: string): string {
  if (!expression) return expression;
  
  let result = expression;
  
  // Replace symbols with words
  const symbolToWord: Array<{ symbol: RegExp; word: string }> = [
    { symbol: /²/g, word: ' squared' },
    { symbol: /³/g, word: ' cubed' },
    { symbol: /\^(\d+)/g, word: ' to the power of $1' },
    { symbol: /√(\w+)/g, word: 'square root of $1' },
    { symbol: /∛(\w+)/g, word: 'cube root of $1' },
    { symbol: /\+/g, word: ' plus ' },
    { symbol: /-/g, word: ' minus ' },
    { symbol: /×/g, word: ' times ' },
    { symbol: /\*/g, word: ' times ' },
    { symbol: /÷/g, word: ' divided by ' },
    { symbol: /\//g, word: ' over ' },
    { symbol: /=/g, word: ' equals ' },
    { symbol: /</g, word: ' less than ' },
    { symbol: />/g, word: ' greater than ' },
    { symbol: /≤/g, word: ' less than or equal to ' },
    { symbol: /≥/g, word: ' greater than or equal to ' },
    { symbol: /≠/g, word: ' not equal to ' },
    { symbol: /π/g, word: 'pi' },
    { symbol: /∞/g, word: 'infinity' },
  ];
  
  for (const { symbol, word } of symbolToWord) {
    result = result.replace(symbol, word);
  }
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Detects if a string contains mathematical content
 */
export function containsMathContent(text: string): boolean {
  if (!text) return false;
  
  const mathIndicators = [
    /\d+\s*[+\-×÷*\/=<>]\s*\d+/, // Basic operations
    /[a-z]\s*[²³^]/, // Variables with exponents
    /√|∛/, // Roots
    /sin|cos|tan|log|ln/, // Functions
    /equation|formula|solve|calculate|compute/i, // Math keywords
    /x\s*=|y\s*=|=\s*x|=\s*y/, // Variable equations
    /\d+x|\d+y/, // Coefficients
    /fraction|numerator|denominator/i, // Fraction terms
    /squared|cubed|power|root/i, // Exponent words
  ];
  
  return mathIndicators.some(pattern => pattern.test(text));
}

/**
 * Extracts mathematical expressions from text
 */
export function extractMathExpressions(text: string): string[] {
  if (!text) return [];
  
  const expressions: string[] = [];
  
  // Match LaTeX-style expressions
  const latexMatches = text.match(/\$[^$]+\$/g);
  if (latexMatches) {
    expressions.push(...latexMatches.map(m => m.replace(/\$/g, '')));
  }
  
  // Match simple equations (e.g., "2x + 3 = 5")
  const equationMatches = text.match(/[\d\w]+\s*[+\-×÷*\/=]\s*[\d\w\s+\-×÷*\/=]+/g);
  if (equationMatches) {
    expressions.push(...equationMatches);
  }
  
  return [...new Set(expressions)]; // Remove duplicates
}

/**
 * Creates a verbal confirmation of a math expression
 * Useful for Gilbert to confirm understanding
 */
export function createMathConfirmation(spokenInput: string): string {
  const normalized = normalizeSpokenMath(spokenInput);
  
  if (normalized === spokenInput.toLowerCase()) {
    return null as any; // No math detected
  }
  
  return `So you're saying ${mathToSpoken(normalized)}, right?`;
}
