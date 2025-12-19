import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/errorHandler';

export const exportService = {
  /**
   * Export count sheet to CSV with empty Actual Count column
   */
  async exportCountSheetCSV(countSheet: any): Promise<string> {
    const csvPath = path.join(process.cwd(), 'tmp', `count-sheet-${countSheet.year}-${Date.now()}.csv`);
    
    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'productName', title: 'Product Name' },
        { id: 'supplier', title: 'Supplier' },
        { id: 'expectedQuantity', title: 'Expected Quantity' },
        { id: 'actualCount', title: 'Actual Count' },
        { id: 'notes', title: 'Notes' },
      ],
    });

    const records = countSheet.items.map((item: any) => ({
      productName: item.product.name,
      supplier: item.product.supplier.name,
      expectedQuantity: item.expectedQuantity,
      actualCount: '', // Empty for user to fill
      notes: '',
    }));

    await csvWriter.writeRecords(records);
    return csvPath;
  },

  /**
   * Export count sheet to PDF for printing
   */
  async exportCountSheetPDF(countSheet: any): Promise<string> {
    const pdfPath = path.join(process.cwd(), 'tmp', `count-sheet-${countSheet.year}-${Date.now()}.pdf`);
    
    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .text(`Year-End Inventory Count - ${countSheet.year}`, { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
        .text(`Total Products: ${countSheet.items.length}`, { align: 'center' })
        .moveDown(2);

      // Table header
      const tableTop = doc.y;
      const colWidths = {
        productName: 200,
        supplier: 120,
        expected: 80,
        actual: 80,
      };

      doc.fontSize(10).font('Helvetica-Bold');
      let x = 50;
      doc.text('Product Name', x, tableTop, { width: colWidths.productName });
      x += colWidths.productName;
      doc.text('Supplier', x, tableTop, { width: colWidths.supplier });
      x += colWidths.supplier;
      doc.text('Expected Qty', x, tableTop, { width: colWidths.expected });
      x += colWidths.expected;
      doc.text('Actual Count', x, tableTop, { width: colWidths.actual });

      // Draw line under header
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table rows
      doc.font('Helvetica');
      let y = tableTop + 25;

      for (const item of countSheet.items) {
        // Check if we need a new page
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        x = 50;
        doc.text(item.product.name, x, y, { width: colWidths.productName });
        x += colWidths.productName;
        doc.text(item.product.supplier.name, x, y, { width: colWidths.supplier });
        x += colWidths.supplier;
        doc.text(item.expectedQuantity.toString(), x, y, { width: colWidths.expected });
        x += colWidths.expected;
        doc.text('__________', x, y, { width: colWidths.actual }); // Line for manual entry

        y += 25;
      }

      // Footer
      doc
        .moveDown(3)
        .fontSize(10)
        .text('Instructions: Count each product physically and write the actual quantity above.', 50)
        .moveDown()
        .text(`Counted by: ________________________  Date: ________________`, 50);

      doc.end();

      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  },

  /**
   * Import count data from CSV
   */
  async importCountDataCSV(csvContent: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Validate and transform data
          const validatedData: any[] = [];
          const errors: string[] = [];

          results.data.forEach((row: any, index: number) => {
            const rowNum = index + 2; // +2 for header and 0-based index

            // Validate required fields
            if (!row['Product Name'] || row['Product Name'].trim() === '') {
              errors.push(`Row ${rowNum}: Product Name is required`);
              return;
            }

            if (!row['Actual Count'] || row['Actual Count'].trim() === '') {
              errors.push(`Row ${rowNum}: Actual Count is required`);
              return;
            }

            // Validate actual count is a number
            const actualCount = parseInt(row['Actual Count']);
            if (isNaN(actualCount) || actualCount < 0) {
              errors.push(`Row ${rowNum}: Actual Count must be a non-negative number`);
              return;
            }

            validatedData.push({
              productName: row['Product Name'].trim(),
              actualCount,
            });
          });

          if (errors.length > 0) {
            reject(new AppError(400, `CSV validation errors:\n${errors.join('\n')}`));
          } else {
            resolve(validatedData);
          }
        },
        error: (error: any) => {
          reject(new AppError(400, `CSV parsing error: ${error.message}`));
        },
      });
    });
  },

  /**
   * Clean up temporary files
   */
  cleanupTempFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  },
};
