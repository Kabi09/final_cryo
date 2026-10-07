import PDFDocument from 'pdfkit';
import { COMPANY_PROFILE } from '../config/constants.js';

export const generateDocumentPDF = (docType, data, stream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(stream);

      const primaryColor = '#0F2C59';
      const secondaryColor = '#333333';
      const lightBg = '#F8FAFC';
      const borderColor = '#CBD5E1';
      const accentColor = '#2563EB';

      // 1. Top Bar
      doc.fontSize(8).fillColor('#64748B').text(`${COMPANY_PROFILE.name}  •  ERP Transaction Document`, 40, 25);
      doc.text('Page 1 of 1', 500, 25, { align: 'right' });
      doc.moveTo(40, 38).lineTo(555, 38).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // 2. Company Brand & Document Title
      doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(COMPANY_PROFILE.name, 40, 48);
      doc.fontSize(9).fillColor('#475569').font('Helvetica').text(COMPANY_PROFILE.tagline, 40, 68);

      // Title & Badge
      const docTitle = docType.toUpperCase();
      doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(docTitle, 350, 48, { align: 'right' });
      
      const docNum = data.docNumber || data.quotationNumber || data.piNumber || data.soNumber || data.invoiceNumber || data.ticketNumber || 'DOC-2026';
      const docDate = data.date ? new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const statusText = data.status || 'OFFICIAL';

      doc.fontSize(10).fillColor('#1E293B').font('Helvetica-Bold').text(`${docNum}  •  ${docDate}`, 320, 68, { align: 'right' });
      doc.fontSize(8).fillColor(accentColor).text(`[ ${statusText} ]`, 350, 82, { align: 'right' });

      // 3. Two Column Meta Box (Seller vs Customer)
      const boxY = 100;
      doc.rect(40, boxY, 250, 85).fillAndStroke(lightBg, borderColor);
      doc.rect(305, boxY, 250, 85).fillAndStroke(lightBg, borderColor);

      // Left Box: SELLER
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748B').text('SELLER / ISSUER', 50, boxY + 8);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text(COMPANY_PROFILE.name, 50, boxY + 20);
      doc.fontSize(8).font('Helvetica').fillColor(secondaryColor).text(COMPANY_PROFILE.address, 50, boxY + 32, { width: 230 });
      doc.text(`GSTIN: ${COMPANY_PROFILE.gstin}`, 50, boxY + 54);
      doc.text(`${COMPANY_PROFILE.email}  •  ${COMPANY_PROFILE.phone}`, 50, boxY + 66);

      // Right Box: CUSTOMER
      const customer = data.customerSnapshot || data.customer || {};
      const buyerLabel = docType.includes('PO') ? 'BUYER / CUSTOMER' : (docType.includes('INVOICE') ? 'BILL TO' : 'QUOTED TO');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748B').text(buyerLabel, 315, boxY + 8);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text(customer.name || 'ABC Hospital & Research Ltd', 315, boxY + 20);
      doc.fontSize(8).font('Helvetica').fillColor(secondaryColor).text(customer.address || 'Industrial Estate, Chennai, Tamil Nadu', 315, boxY + 32, { width: 230 });
      doc.text(`GSTIN: ${customer.gstin || '33YYYYYYYYYY1Z8'}`, 315, boxY + 54);
      doc.text(`Contact: ${customer.contactPerson || 'Authorized Representative'}  •  ${customer.phone || '+91 9XXXXXXXXX'}`, 315, boxY + 66);

      // 4. Items Table
      let tableY = 200;
      doc.rect(40, tableY, 515, 22).fillAndStroke(primaryColor, primaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      doc.text('#', 48, tableY + 7);
      doc.text('DESCRIPTION / PRODUCT', 75, tableY + 7);
      doc.text('QTY', 285, tableY + 7);
      doc.text('UNIT PRICE', 325, tableY + 7);
      doc.text('DISCOUNT', 395, tableY + 7);
      doc.text('TAX', 455, tableY + 7);
      doc.text('TOTAL', 500, tableY + 7, { align: 'right', width: 45 });

      tableY += 22;
      const items = data.items && data.items.length > 0 ? data.items : [
        {
          productCode: 'CFS-ULT-500',
          description: 'Ultra Low Temperature Freezer (-80°C) Model CFS-ULT-500',
          quantity: 1,
          unit: 'Units',
          unitPrice: 250000,
          discount: 10000,
          taxRate: 18,
          totalAmount: 283200
        }
      ];

      items.forEach((item, index) => {
        const rowHeight = 28;
        const fill = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, tableY, 515, rowHeight).fillAndStroke(fill, borderColor);

        doc.fillColor(secondaryColor).font('Helvetica').fontSize(8);
        doc.text(String(index + 1).padStart(2, '0'), 48, tableY + 8);
        
        doc.font('Helvetica-Bold').text(item.description || item.productCode || 'Scientific Equipment', 75, tableY + 5, { width: 200 });
        if (item.productCode) {
          doc.font('Helvetica').fontSize(7).fillColor('#64748B').text(`Code: ${item.productCode}`, 75, tableY + 16);
        }

        doc.fillColor(secondaryColor).font('Helvetica').fontSize(8);
        doc.text(`${item.quantity} ${item.unit || ''}`, 285, tableY + 8);
        doc.text(`₹${Number(item.unitPrice || 0).toLocaleString('en-IN')}`, 325, tableY + 8);
        doc.text(`₹${Number(item.discount || 0).toLocaleString('en-IN')}`, 395, tableY + 8);
        doc.text(`${item.taxRate || 18}%`, 455, tableY + 8);
        doc.font('Helvetica-Bold').text(`₹${Number(item.totalAmount || (item.taxableAmount ? item.taxableAmount * 1.18 : 0)).toLocaleString('en-IN')}`, 490, tableY + 8, { align: 'right', width: 55 });

        tableY += rowHeight;
      });

      // 5. Commercial Terms & Calculation Summary
      const summaryY = tableY + 15;
      
      // Left Box: Terms
      doc.rect(40, summaryY, 290, 110).fillAndStroke(lightBg, borderColor);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8).text('COMMERCIAL TERMS & NOTES', 50, summaryY + 8);
      doc.fillColor(secondaryColor).font('Helvetica').fontSize(7.5);
      doc.text(`• Payment Terms: ${data.paymentTerms || '30% advance on confirmation, balance before dispatch.'}`, 50, summaryY + 22, { width: 270 });
      doc.text(`• Delivery Period: ${data.deliveryPeriod || '6–8 weeks from order date and advance receipt.'}`, 50, summaryY + 44, { width: 270 });
      doc.text(`• Warranty: ${data.warrantyTerms || '12 Months comprehensive manufacturer warranty.'}`, 50, summaryY + 62, { width: 270 });
      doc.text(`• Validity: Subject to standard terms of Cryo Scientific Systems. Customer revisions issued separately.`, 50, summaryY + 80, { width: 270 });

      // Right Box: Totals
      const calcX = 350;
      doc.rect(calcX, summaryY, 205, 110).strokeColor(borderColor).lineWidth(1).stroke();

      const taxable = data.taxableAmount || (data.grandTotal ? data.grandTotal / 1.18 : 240000);
      const discount = data.totalDiscount || 0;
      const tax = data.taxAmount || (data.grandTotal ? data.grandTotal - taxable : 43200);
      const grandTotal = data.grandTotal || (taxable + tax);

      doc.fontSize(8).font('Helvetica').fillColor('#64748B').text('Discount:', calcX + 10, summaryY + 12);
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text(`₹${Number(discount).toLocaleString('en-IN')}`, calcX + 110, summaryY + 12, { align: 'right', width: 85 });

      doc.font('Helvetica').fillColor('#64748B').text('Taxable Value:', calcX + 10, summaryY + 30);
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text(`₹${Number(taxable).toLocaleString('en-IN')}`, calcX + 110, summaryY + 30, { align: 'right', width: 85 });

      doc.font('Helvetica').fillColor('#64748B').text('GST @ 18%:', calcX + 10, summaryY + 48);
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text(`₹${Number(tax).toLocaleString('en-IN')}`, calcX + 110, summaryY + 48, { align: 'right', width: 85 });

      // Grand Total Highlight
      doc.rect(calcX, summaryY + 70, 205, 40).fill(primaryColor);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF').text('GRAND TOTAL', calcX + 10, summaryY + 84);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF').text(`₹${Number(grandTotal).toLocaleString('en-IN')}`, calcX + 90, summaryY + 83, { align: 'right', width: 105 });

      // 6. Sign-off Footer
      const footerY = summaryY + 135;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.fontSize(7).fillColor('#64748B').font('Helvetica').text('This document is electronically generated from Cryo Scientific Systems ERP.', 40, footerY + 8);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor).text('Authorized Signatory ______________________________', 330, footerY + 8, { align: 'right' });

      doc.end();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
