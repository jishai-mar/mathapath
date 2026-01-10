import jsPDF from 'jspdf';
import { NotebookEntry } from '@/hooks/useNotebook';

interface ExportOptions {
  title?: string;
  includePersonalNotes?: boolean;
  includeDate?: boolean;
}

// Parse worked example content into sections
function parseWorkedExample(content: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = content.split('\n');
  let currentSection = { title: '', content: '' };
  
  for (const line of lines) {
    if (line.startsWith('📝 ') || line.startsWith('🔢 ') || line.startsWith('✅ ') || line.startsWith('💡 ')) {
      if (currentSection.title || currentSection.content) {
        sections.push(currentSection);
      }
      currentSection = { title: line, content: '' };
    } else if (line.trim()) {
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }
  if (currentSection.title || currentSection.content) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Clean emoji prefixes for PDF
function cleanEmojiPrefix(text: string): string {
  return text
    .replace(/^📝\s*/, 'Question: ')
    .replace(/^🔢\s*/, '')
    .replace(/^✅\s*/, 'Answer: ')
    .replace(/^💡\s*/, 'Tip: ');
}

// Wrap text to fit within page width
function wrapText(text: string, maxWidth: number, doc: jsPDF): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export function exportSolutionsToPdf(
  entries: NotebookEntry[],
  options: ExportOptions = {}
): void {
  const {
    title = 'My Study Guide - Saved Solutions',
    includePersonalNotes = true,
    includeDate = true,
  } = options;

  // Filter to only worked_example entries
  const solutions = entries.filter(e => e.note_type === 'worked_example');
  
  if (solutions.length === 0) {
    throw new Error('No saved solutions to export');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const titleLines = wrapText(title, contentWidth, doc);
  titleLines.forEach(line => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  });

  yPosition += 5;
  
  if (includeDate) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(11);
  doc.text(`${solutions.length} solution${solutions.length !== 1 ? 's' : ''} saved`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Solutions content
  solutions.forEach((solution, index) => {
    checkNewPage(40);

    // Solution header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text(`Solution ${index + 1}`, margin, yPosition);
    
    if (solution.subtopic_name) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const subtopicX = margin + doc.getTextWidth(`Solution ${index + 1}  `);
      doc.text(`• ${solution.subtopic_name}`, subtopicX, yPosition);
    }
    
    yPosition += 8;
    doc.setTextColor(0, 0, 0);

    // Parse and render sections
    const sections = parseWorkedExample(solution.content);
    
    sections.forEach((section) => {
      checkNewPage(20);
      
      const cleanTitle = cleanEmojiPrefix(section.title);
      
      // Section title styling based on type
      if (section.title.startsWith('✅')) {
        doc.setTextColor(16, 185, 129); // Green for answer
        doc.setFont('helvetica', 'bold');
      } else if (section.title.startsWith('💡')) {
        doc.setTextColor(245, 158, 11); // Amber for tip
        doc.setFont('helvetica', 'italic');
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
      }
      
      doc.setFontSize(11);
      const titleLines = wrapText(cleanTitle, contentWidth, doc);
      titleLines.forEach(line => {
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      // Section content
      if (section.content) {
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const contentLines = section.content.split('\n');
        contentLines.forEach(contentLine => {
          checkNewPage(8);
          const wrappedLines = wrapText(contentLine, contentWidth - 10, doc);
          wrappedLines.forEach(line => {
            doc.text(line, margin + 5, yPosition);
            yPosition += 5;
          });
        });
      }
      
      yPosition += 3;
    });

    // Personal note
    if (includePersonalNotes && solution.personal_note) {
      checkNewPage(25);
      
      // Note box background
      doc.setFillColor(255, 251, 235); // Amber background
      doc.setDrawColor(251, 191, 36); // Amber border
      const noteHeight = Math.min(30, 15 + (solution.personal_note.length / 50) * 5);
      doc.roundedRect(margin, yPosition - 2, contentWidth, noteHeight, 2, 2, 'FD');
      
      yPosition += 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9); // Amber text
      doc.text('My Note:', margin + 5, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const noteLines = wrapText(solution.personal_note, contentWidth - 15, doc);
      noteLines.slice(0, 3).forEach(line => {
        doc.text(line, margin + 5, yPosition);
        yPosition += 4;
      });
      
      yPosition += noteHeight - 15;
    }

    // Divider between solutions
    if (index < solutions.length - 1) {
      yPosition += 5;
      checkNewPage(10);
      doc.setDrawColor(220, 220, 220);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
      doc.setLineDashPattern([], 0);
      yPosition += 10;
    }
  });

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated with MathPath', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `study-guide-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
