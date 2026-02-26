// /lib/receipt-pdf.js
// PDF receipt generator for Range Medical purchases
// Uses pdf-lib — same pattern as assessment PDF in pages/api/assessment/complete.js

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateReceiptPdf({
  firstName,
  invoiceId,
  date,
  description,
  originalAmountCents,
  discountLabel,
  amountPaidCents,
  cardBrand,
  cardLast4,
  paymentMethod,
}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const leftMargin = 42;
  const rightMargin = 42;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const grayColor = rgb(0.51, 0.51, 0.51);
  const greenColor = rgb(0.086, 0.639, 0.29); // #16A34A
  const lightGray = rgb(0.96, 0.96, 0.96); // #f5f5f5

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos;

  // ===== HEADER BAR =====
  const headerBarHeight = 55;
  page.drawRectangle({
    x: 0, y: pageHeight - headerBarHeight,
    width: pageWidth, height: headerBarHeight,
    color: black,
  });

  // Title — left
  page.drawText('RANGE MEDICAL', {
    x: leftMargin, y: pageHeight - 24, size: 16, font: fontBold, color: white,
  });
  page.drawText('Purchase Receipt', {
    x: leftMargin, y: pageHeight - 40, size: 9, font, color: white,
  });

  // Date — right
  const dateLabel = `Date: ${date}`;
  const dateLabelWidth = font.widthOfTextAtSize(dateLabel, 8);
  page.drawText(dateLabel, {
    x: pageWidth - rightMargin - dateLabelWidth, y: pageHeight - 24, size: 8, font, color: white,
  });
  const addressText = '1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660';
  const addressWidth = font.widthOfTextAtSize(addressText, 8);
  page.drawText(addressText, {
    x: pageWidth - rightMargin - addressWidth, y: pageHeight - 40, size: 8, font, color: white,
  });

  yPos = pageHeight - headerBarHeight - 30;

  // ===== GREETING =====
  page.drawText(`Receipt for ${firstName}`, {
    x: leftMargin, y: yPos, size: 14, font: fontBold, color: black,
  });
  yPos -= 30;

  // ===== DETAILS SECTION (left border) =====
  const detailsStartY = yPos;

  const drawDetail = (label, value) => {
    page.drawText(label, {
      x: leftMargin + 14, y: yPos, size: 9, font: fontBold, color: grayColor,
    });
    page.drawText(value || 'N/A', {
      x: leftMargin + 120, y: yPos, size: 9, font, color: black,
    });
    yPos -= 18;
  };

  const isComp = amountPaidCents === 0;

  // Payment method display
  let paymentDisplay;
  if (isComp) {
    paymentDisplay = 'Complimentary';
  } else if (paymentMethod) {
    paymentDisplay = paymentMethod;
  } else if (cardBrand && cardLast4) {
    paymentDisplay = `${cardBrand.toUpperCase()} ending in ${cardLast4}`;
  } else {
    paymentDisplay = 'Payment processed';
  }

  drawDetail('Invoice #:', String(invoiceId));
  drawDetail('Date:', date);
  drawDetail('Service:', description);
  drawDetail('Payment:', paymentDisplay);

  // Draw the left border line
  page.drawRectangle({
    x: leftMargin, y: yPos + 4,
    width: 4, height: detailsStartY - yPos - 4,
    color: black,
  });

  yPos -= 20;

  // ===== AMOUNT BOX =====
  const hasDiscount = !isComp && originalAmountCents && originalAmountCents !== amountPaidCents;

  const boxHeight = isComp ? 44 : hasDiscount ? 80 : 44;
  const boxY = yPos - boxHeight;

  // Gray background
  page.drawRectangle({
    x: leftMargin, y: boxY,
    width: contentWidth, height: boxHeight,
    color: lightGray,
  });

  if (isComp) {
    // Complimentary — single centered line
    const compText = 'Complimentary';
    const compWidth = fontBold.widthOfTextAtSize(compText, 18);
    page.drawText(compText, {
      x: leftMargin + (contentWidth - compWidth) / 2,
      y: boxY + (boxHeight - 18) / 2,
      size: 18, font: fontBold, color: greenColor,
    });
  } else if (hasDiscount) {
    // Original amount
    const origLabel = 'Original Amount';
    const origValue = `$${(originalAmountCents / 100).toFixed(2)}`;
    page.drawText(origLabel, {
      x: leftMargin + 20, y: boxY + boxHeight - 22, size: 10, font, color: grayColor,
    });
    const origValWidth = font.widthOfTextAtSize(origValue, 10);
    page.drawText(origValue, {
      x: leftMargin + contentWidth - 20 - origValWidth, y: boxY + boxHeight - 22, size: 10, font, color: grayColor,
    });

    // Discount line
    const discountCents = originalAmountCents - amountPaidCents;
    const discLine = discountLabel ? `Discount (${discountLabel})` : 'Discount';
    const discValue = `-$${(discountCents / 100).toFixed(2)}`;
    page.drawText(discLine, {
      x: leftMargin + 20, y: boxY + boxHeight - 40, size: 10, font, color: greenColor,
    });
    const discValWidth = font.widthOfTextAtSize(discValue, 10);
    page.drawText(discValue, {
      x: leftMargin + contentWidth - 20 - discValWidth, y: boxY + boxHeight - 40, size: 10, font, color: greenColor,
    });

    // Separator line
    page.drawRectangle({
      x: leftMargin + 20, y: boxY + boxHeight - 50,
      width: contentWidth - 40, height: 0.5,
      color: grayColor,
    });

    // Amount paid
    const paidLabel = 'Amount Paid';
    const paidValue = `$${(amountPaidCents / 100).toFixed(2)}`;
    page.drawText(paidLabel, {
      x: leftMargin + 20, y: boxY + 10, size: 12, font: fontBold, color: black,
    });
    const paidValWidth = fontBold.widthOfTextAtSize(paidValue, 12);
    page.drawText(paidValue, {
      x: leftMargin + contentWidth - 20 - paidValWidth, y: boxY + 10, size: 12, font: fontBold, color: black,
    });
  } else {
    // Simple amount
    const paidLabel = 'Amount Paid';
    const paidValue = `$${(amountPaidCents / 100).toFixed(2)}`;
    const labelWidth = fontBold.widthOfTextAtSize(paidLabel, 12);
    const valWidth = fontBold.widthOfTextAtSize(paidValue, 12);
    page.drawText(paidLabel, {
      x: leftMargin + 20, y: boxY + (boxHeight - 12) / 2, size: 12, font: fontBold, color: black,
    });
    page.drawText(paidValue, {
      x: leftMargin + contentWidth - 20 - valWidth, y: boxY + (boxHeight - 12) / 2, size: 12, font: fontBold, color: black,
    });
  }

  yPos = boxY - 40;

  // ===== FOOTER =====
  const footerLine1 = 'Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660';
  const footerLine2 = '(949) 997-3988 | info@range-medical.com';
  const f1Width = font.widthOfTextAtSize(footerLine1, 8);
  const f2Width = font.widthOfTextAtSize(footerLine2, 8);

  page.drawText(footerLine1, {
    x: (pageWidth - f1Width) / 2, y: 30, size: 8, font, color: grayColor,
  });
  page.drawText(footerLine2, {
    x: (pageWidth - f2Width) / 2, y: 18, size: 8, font, color: grayColor,
  });

  return await pdfDoc.save();
}
