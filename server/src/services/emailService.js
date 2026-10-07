import nodemailer from 'nodemailer';
import { COMPANY_PROFILE } from '../config/constants.js';

/**
 * Configure reusable nodemailer transporter from environment variables
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.warn('[EmailService] SMTP credentials not fully configured.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send Quotation Email with attached vector PDF and direct customer portal link
 */
export const sendQuotationEmail = async ({ to, quotation, pdfBuffer, publicUrl }) => {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, reason: 'SMTP not configured' };
  }

  const customerName = quotation.customerSnapshot?.name || quotation.customer?.name || 'Valued Customer';
  const quoteNumber = quotation.quotationNumber || 'QT-2026';
  const grandTotal = quotation.grandTotal ? `₹${Number(quotation.grandTotal).toLocaleString('en-IN')}` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #0B192C; color: #ffffff; padding: 24px 30px; }
        .header h2 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; }
        .body { padding: 30px; color: #1e293b; font-size: 14px; line-height: 1.6; }
        .highlight-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 0 4px 4px 0; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 30px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2>${COMPANY_PROFILE.name}</h2>
          <p>${COMPANY_PROFILE.tagline}</p>
        </div>
        <div class="body">
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>Thank you for your enquiry with Cryo Scientific Systems. We are pleased to submit our formal commercial proposal <strong>${quoteNumber}</strong>.</p>
          
          <div class="highlight-box">
            <div><strong>Proposal Number:</strong> ${quoteNumber}</div>
            <div><strong>Total Contract Value:</strong> ${grandTotal} (incl. GST)</div>
            <div><strong>Warranty Coverage:</strong> 12 Months Standard Manufacturer Warranty</div>
          </div>

          <p>The official vector PDF quotation document is attached to this email. You can also view, review specifications, request revisions, or accept the quotation directly through our secure online portal:</p>
          
          <div style="text-align: center;">
            <a href="${publicUrl}" class="btn" target="_blank">Review & Accept Quotation Online</a>
          </div>

          <p style="font-size: 12px; color: #64748b;">Direct link: <a href="${publicUrl}" style="color: #2563eb;">${publicUrl}</a></p>
        </div>
        <div class="footer">
          ${COMPANY_PROFILE.name} &bull; ${COMPANY_PROFILE.address}<br>
          Phone: ${COMPANY_PROFILE.phone} &bull; Email: ${COMPANY_PROFILE.email}
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${COMPANY_PROFILE.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Commercial Quotation ${quoteNumber} — ${COMPANY_PROFILE.name}`,
    html: htmlContent,
    attachments: pdfBuffer ? [
      {
        filename: `${quoteNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ] : []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Quotation email dispatched successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send quotation email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};
