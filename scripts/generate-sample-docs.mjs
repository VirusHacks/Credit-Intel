/**
 * generate-sample-docs.mjs
 * Generates realistic Indian corporate lending sample PDFs for pipeline testing.
 *
 * Run:  node scripts/generate-sample-docs.mjs
 *
 * Output: sample-documents/
 *   â”œâ”€â”€ bank-statement.pdf       (12-month CC/OD statement)
 *   â”œâ”€â”€ gst-return.pdf           (GSTR-3B Aprâ€“Mar)
 *   â”œâ”€â”€ itr.pdf                  (ITR-6 FY 2023-24)
 *   â”œâ”€â”€ balance-sheet.pdf        (Audited Balance Sheet + P&L)
 *   â””â”€â”€ cibil-report.pdf         (CMR Rank 4 credit report)
 *
 * Fictional company: Sharma Textile Industries Pvt. Ltd.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'fs';

const OUT = './sample-documents';
mkdirSync(OUT, { recursive: true });

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function newDoc() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  return { doc, regular, bold };
}

function addPage(doc) {
  return doc.addPage([595, 842]); // A4
}

function write(page, font, size, x, y, text, color = rgb(0,0,0)) {
  page.drawText(String(text), { x, y, size, font, color });
}

function line(page, x1, y1, x2, y2, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 },
    thickness, color: rgb(0.4, 0.4, 0.4) });
}

function rect(page, x, y, w, h, fillColor) {
  page.drawRectangle({ x, y, width: w, height: h, color: fillColor });
}

function inr(n) {
  return 'â‚¹' + n.toLocaleString('en-IN');
}

const CO = {
  name:    'Sharma Textile Industries Pvt. Ltd.',
  cin:     'U17110MH2018PTC308123',
  gstin:   '27AABCS9999K1ZV',
  pan:     'AABCS9999K',
  address: '42, MIDC Industrial Area, Bhiwandi, Thane, Maharashtra - 421302',
  promoter:'Mr. Rajesh Sharma (DIN: 08123456)',
  loanAmt: 'â‚¹1,50,00,000',
};

// â”€â”€ 1. BANK STATEMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function makeBankStatement() {
  const { doc, regular, bold } = await newDoc();

  // â”€â”€ PAGE 1: Header + Account Details â”€â”€
  const p1 = addPage(doc);
  rect(p1, 0, 792, 595, 50, rgb(0.06, 0.35, 0.62));
  write(p1, bold,    16, 30, 805, 'State Bank of India', rgb(1,1,1));
  write(p1, regular, 9,  30, 793, 'Bhiwandi Branch | IFSC: SBIN0012847 | MICR: 421002001', rgb(1,1,1));

  write(p1, bold,    13, 30, 760, 'ACCOUNT STATEMENT');
  write(p1, regular, 9,  30, 745, `Account Holder : ${CO.name}`);
  write(p1, regular, 9,  30, 733, `Account Number : XXXXX2847 (Cash Credit / OD Limit: â‚¹1,00,00,000)`);
  write(p1, regular, 9,  30, 721, `IFSC Code      : SBIN0012847`);
  write(p1, regular, 9,  30, 709, `Statement Period: 01-Apr-2023 to 31-Mar-2024`);
  write(p1, regular, 9,  30, 697, `CIN / PAN      : ${CO.cin} / ${CO.pan}`);
  write(p1, regular, 9,  30, 685, `Address        : ${CO.address}`);
  line(p1, 30, 678, 565, 678);

  // Monthly summary table
  write(p1, bold, 10, 30, 665, 'MONTHLY CREDIT / DEBIT SUMMARY (FY 2023-24)');
  const hdrY = 650;
  rect(p1, 30, hdrY - 4, 535, 16, rgb(0.9, 0.93, 0.97));
  write(p1, bold, 8, 35,  hdrY, 'Month');
  write(p1, bold, 8, 110, hdrY, 'Total Credits (â‚¹)');
  write(p1, bold, 8, 220, hdrY, 'Total Debits (â‚¹)');
  write(p1, bold, 8, 330, hdrY, 'Closing Balance (â‚¹)');
  write(p1, bold, 8, 450, hdrY, 'ABB (â‚¹)');

  const months = [
    ['Apr-23', 31_20_000,  28_50_000,  2_70_000,  3_10_000],
    ['May-23', 33_45_000,  30_10_000,  5_05_000,  4_80_000],
    ['Jun-23', 29_80_000,  27_30_000,  7_55_000,  6_90_000],
    ['Jul-23', 35_60_000,  34_20_000,  8_95_000,  8_50_000],
    ['Aug-23', 38_20_000,  36_10_000, 11_05_000,  9_80_000],
    ['Sep-23', 42_50_000,  40_80_000, 12_75_000, 12_00_000],
    ['Oct-23', 44_30_000,  41_90_000, 15_15_000, 13_90_000],
    ['Nov-23', 36_70_000,  34_20_000, 17_65_000, 16_40_000],
    ['Dec-23', 29_40_000,  26_80_000, 20_25_000, 18_90_000],
    ['Jan-24', 41_80_000,  38_40_000, 23_65_000, 21_70_000],
    ['Feb-24', 38_20_000,  35_10_000, 26_75_000, 25_10_000],
    ['Mar-24', 45_60_000,  42_10_000, 30_25_000, 28_80_000],
  ];

  let rowY = hdrY - 18;
  for (const [m, cr, db, cb, abb] of months) {
    write(p1, regular, 8, 35,  rowY, m);
    write(p1, regular, 8, 110, rowY, cr.toLocaleString('en-IN'));
    write(p1, regular, 8, 220, rowY, db.toLocaleString('en-IN'));
    write(p1, regular, 8, 330, rowY, cb.toLocaleString('en-IN'));
    write(p1, regular, 8, 450, rowY, abb.toLocaleString('en-IN'));
    rowY -= 14;
  }
  line(p1, 30, rowY + 6, 565, rowY + 6);
  write(p1, bold, 8, 35,  rowY - 6, 'TOTAL');
  write(p1, bold, 8, 110, rowY - 6, '4,47,75,000');
  write(p1, bold, 8, 220, rowY - 6, '4,15,50,000');
  write(p1, regular, 7, 30, rowY - 22, 'Average Annual Credit Turnover: â‚¹37,31,250 per month  |  Annual Bank Credits: â‚¹4,47,75,000');
  write(p1, regular, 7, 30, rowY - 34, 'Average Bank Balance (ABB): â‚¹14,15,833  |  Utilisation of OD Limit: 68â€“84%');

  // â”€â”€ PAGE 2: Key Transaction Details â”€â”€
  const p2 = addPage(doc);
  rect(p2, 0, 792, 595, 50, rgb(0.06, 0.35, 0.62));
  write(p2, bold, 16, 30, 805, 'State Bank of India', rgb(1,1,1));
  write(p2, regular, 9, 30, 793, 'Account Statement â€” Page 2', rgb(1,1,1));

  write(p2, bold, 11, 30, 760, 'KEY OBSERVATIONS / ANALYST FLAGS');
  const flags = [
    '1. No EMI bounces or cheque returns observed in the 12-month period.',
    '2. Inward remittances from 3 related entities detected (Sharma Fabrics, Sharma Exports, RS Trading)',
    '   â€” aggregate â‚¹28.4 L over the year (~6.3% of total credits). Circular transaction risk: LOW.',
    '3. Seasonal spike in credits: Octâ€“Mar (peak textile season) â€” consistent with business profile.',
    '4. OD utilisation never exceeded 84% of sanctioned limit (â‚¹1 Cr). No over-limit incidents.',
    '5. Cash withdrawal ratio: 12% of total debits â€” within acceptable range (< 25%).',
    '6. 2 instances of delayed credit â€” inflows received 4â€“5 days after invoice date in Aug & Dec.',
    '7. Average Closing Balance growing trend: â‚¹2.7L (Apr) â†’ â‚¹30.3L (Mar) â€” strong liquidity build-up.',
  ];
  let fy = 742;
  for (const f of flags) {
    write(p2, regular, 8, 35, fy, f);
    fy -= 16;
  }
  line(p2, 30, fy, 565, fy);
  write(p2, bold, 10, 30, fy - 16, 'REPRESENTATIVE TRANSACTIONS (Oct 2023)');
  const txns = [
    ['01-Oct-23', 'RTGS-IN HDFC BANK - RAMESH EXPORTS PVT LTD',      '4,80,000', '',         '15,95,000'],
    ['03-Oct-23', 'NEFT-OUT SBI - GUJARAT COTTON MILLS LTD',          '',         '3,60,000', '12,35,000'],
    ['07-Oct-23', 'RTGS-IN ICICI BANK - BOMBAY TRADING CO',           '6,20,000', '',         '18,55,000'],
    ['10-Oct-23', 'NEFT-OUT HDFC - POWER & UTILITIES BOARD (EMI)',     '',         '1,85,000', '16,70,000'],
    ['15-Oct-23', 'RTGS-IN SBI PUNE - DENIM FABRICS INDIA',           '8,40,000', '',         '25,10,000'],
    ['18-Oct-23', 'NEFT-OUT ICICI - SHARMA FABRICS (RELATED PARTY)',  '',         '2,30,000', '22,80,000'],
    ['22-Oct-23', 'CASH WITHDRAWAL - COUNTER',                        '',         '1,50,000', '21,30,000'],
    ['28-Oct-23', 'RTGS-IN AXIS BANK - KOTHARI APPAREL PVT LTD',     '5,90,000', '',         '27,20,000'],
    ['31-Oct-23', 'BANK CHARGES / INTEREST ON OD',                    '',         '   18,500', '27,01,500'],
  ];
  rect(p2, 30, fy - 38, 535, 14, rgb(0.9, 0.93, 0.97));
  write(p2, bold, 7, 35,  fy - 36, 'Date');
  write(p2, bold, 7, 95,  fy - 36, 'Narration');
  write(p2, bold, 7, 330, fy - 36, 'Credit (â‚¹)');
  write(p2, bold, 7, 410, fy - 36, 'Debit (â‚¹)');
  write(p2, bold, 7, 490, fy - 36, 'Balance (â‚¹)');
  let ty = fy - 52;
  for (const [dt, nar, cr, db, bal] of txns) {
    write(p2, regular, 7, 35,  ty, dt);
    write(p2, regular, 7, 95,  ty, nar);
    write(p2, regular, 7, 330, ty, cr);
    write(p2, regular, 7, 410, ty, db);
    write(p2, regular, 7, 490, ty, bal);
    ty -= 13;
  }
  write(p2, regular, 7, 30, ty - 10,
    'This statement is computer generated and does not require a signature. ' +
    'For disputes contact: bhiwandi.branch@sbi.co.in | 1800-11-2211');

  const bytes = await doc.save();
  writeFileSync(`${OUT}/bank-statement.pdf`, bytes);
  console.log('âœ“ bank-statement.pdf');
}

// â”€â”€ 2. GST RETURN (GSTR-3B) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function makeGstReturn() {
  const { doc, regular, bold } = await newDoc();

  const p1 = addPage(doc);
  rect(p1, 0, 792, 595, 50, rgb(0.05, 0.50, 0.25));
  write(p1, bold,    14, 30, 808, 'GOODS AND SERVICES TAX â€” RETURN SUMMARY', rgb(1,1,1));
  write(p1, regular,  9, 30, 793, 'Form GSTR-3B | Monthly Return Summary | Portal: gstin.gov.in', rgb(1,1,1));

  write(p1, bold, 10, 30, 768, 'TAXPAYER DETAILS');
  line(p1, 30, 764, 565, 764);
  write(p1, regular, 9, 30, 752, `Legal Name of Business : ${CO.name}`);
  write(p1, regular, 9, 30, 740, `GSTIN                  : ${CO.gstin}`);
  write(p1, regular, 9, 30, 728, `PAN                    : ${CO.pan}`);
  write(p1, regular, 9, 30, 716, `State                  : Maharashtra (State Code: 27)`);
  write(p1, regular, 9, 30, 704, `Return Period          : April 2023 â€“ March 2024 (FY 2023-24)`);
  write(p1, regular, 9, 30, 692, `Trade Name             : Sharma Textiles`);
  line(p1, 30, 686, 565, 686);

  write(p1, bold, 10, 30, 673, 'TABLE 3.1 â€” OUTWARD SUPPLIES (GSTR-3B DECLARED)');
  rect(p1, 30, 656, 535, 14, rgb(0.88, 0.96, 0.90));
  write(p1, bold, 8, 35,  658, 'Month');
  write(p1, bold, 8, 130, 658, 'Taxable Value (â‚¹)');
  write(p1, bold, 8, 250, 658, 'IGST (â‚¹)');
  write(p1, bold, 8, 340, 658, 'CGST (â‚¹)');
  write(p1, bold, 8, 430, 658, 'SGST (â‚¹)');
  write(p1, bold, 8, 510, 658, 'Total Tax (â‚¹)');

  const gstRows = [
    ['Apr-23', 28_50_000,  2_28_000,  0,         0,         2_28_000],
    ['May-23', 31_20_000,  2_49_600,  0,         0,         2_49_600],
    ['Jun-23', 26_80_000,  1_60_800,  53_600,    53_600,    2_68_000],
    ['Jul-23', 34_10_000,  2_72_800,  0,         0,         2_72_800],
    ['Aug-23', 37_40_000,  2_99_200,  0,         0,         2_99_200],
    ['Sep-23', 40_50_000,  2_43_000,  81_000,    81_000,    4_05_000],
    ['Oct-23', 43_20_000,  3_45_600,  0,         0,         3_45_600],
    ['Nov-23', 35_60_000,  2_84_800,  0,         0,         2_84_800],
    ['Dec-23', 27_90_000,  1_67_400,  55_800,    55_800,    2_79_000],
    ['Jan-24', 40_30_000,  3_22_400,  0,         0,         3_22_400],
    ['Feb-24', 37_20_000,  2_97_600,  0,         0,         2_97_600],
    ['Mar-24', 44_80_000,  3_58_400,  0,         0,         3_58_400],
  ];

  let ry = 643;
  for (const [m, tv, igst, cgst, sgst, tot] of gstRows) {
    write(p1, regular, 8, 35,  ry, m);
    write(p1, regular, 8, 130, ry, tv.toLocaleString('en-IN'));
    write(p1, regular, 8, 250, ry, igst.toLocaleString('en-IN'));
    write(p1, regular, 8, 340, ry, cgst.toLocaleString('en-IN'));
    write(p1, regular, 8, 430, ry, sgst.toLocaleString('en-IN'));
    write(p1, regular, 8, 510, ry, tot.toLocaleString('en-IN'));
    ry -= 13;
  }
  line(p1, 30, ry + 5, 565, ry + 5);
  write(p1, bold, 8, 35,  ry - 5, 'TOTAL');
  write(p1, bold, 8, 130, ry - 5, '4,27,50,000');
  write(p1, bold, 8, 510, ry - 5, '34,10,400');

  write(p1, bold, 9, 30, ry - 22, 'ITC SUMMARY (INPUT TAX CREDIT)');
  write(p1, regular, 8, 30, ry - 34, 'Total ITC Available (GSTR-2A/2B): â‚¹31,24,800  |  ITC Claimed (GSTR-3B): â‚¹28,90,500  |  Net ITC Lapsed: â‚¹2,34,300');
  write(p1, regular, 8, 30, ry - 46, 'GSTR-3B vs GSTR-2A Variance: â‚¹2,85,900 (6.7% mismatch â€” under investigation, mainly 2 vendors not filed returns)');

  write(p1, bold, 9, 30, ry - 62, 'E-WAY BILL RECONCILIATION');
  write(p1, regular, 8, 30, ry - 74, 'E-Way Bills generated: 847  |  Cancelled: 23  |  Active Bills value: â‚¹4,19,40,000');
  write(p1, regular, 8, 30, ry - 86, 'Reconciliation with GSTR-1: MATCHED (variance < 0.5%)');

  write(p1, regular, 7, 30, ry - 105,
    'Filing Status: All 12 monthly GSTR-3B returns filed on time. No late fees levied. ' +
    'GSTIN Status: ACTIVE. Annual Return GSTR-9 for FY 2022-23 filed.');

  const bytes = await doc.save();
  writeFileSync(`${OUT}/gst-return.pdf`, bytes);
  console.log('âœ“ gst-return.pdf');
}

// â”€â”€ 3. ITR (ITR-6) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function makeITR() {
  const { doc, regular, bold } = await newDoc();

  const p1 = addPage(doc);
  rect(p1, 0, 792, 595, 50, rgb(0.55, 0.08, 0.08));
  write(p1, bold,    14, 30, 808, 'INCOME TAX RETURN â€” ITR-6', rgb(1,1,1));
  write(p1, regular,  9, 30, 793, 'Assessment Year 2024-25 | FY 2023-24 | incometaxindia.gov.in', rgb(1,1,1));

  write(p1, bold, 10, 30, 768, 'PART A â€” GENERAL INFORMATION');
  line(p1, 30, 764, 565, 764);
  write(p1, regular, 9, 30, 752, `Name of Company   : ${CO.name}`);
  write(p1, regular, 9, 30, 740, `PAN               : ${CO.pan}`);
  write(p1, regular, 9, 30, 728, `CIN               : ${CO.cin}`);
  write(p1, regular, 9, 30, 716, `Date of Incorp.   : 12-Mar-2018`);
  write(p1, regular, 9, 30, 704, `Registered Office : ${CO.address}`);
  write(p1, regular, 9, 30, 692, `Nature of Business: Manufacture of Woven Fabrics (NIC Code: 13121)`);
  write(p1, regular, 9, 30, 680, `Auditor           : M/s Joshi & Co., Chartered Accountants, Mumbai (ICAI Reg: 123456W)`);
  write(p1, regular, 9, 30, 668, `Audit Report Date : 28-Sep-2024 | ITR Filed : 30-Oct-2024 | Acknowledgement No: 123456789012345`);
  line(p1, 30, 662, 565, 662);

  write(p1, bold, 10, 30, 650, 'PART B-TI â€” COMPUTATION OF TOTAL INCOME');

  const incomeRows = [
    ['1.', 'Revenue from Operations (Net)',                       '4,21,80,000'],
    ['2.', 'Other Income (Interest on FD, Misc)',                    '3,45,000'],
    ['',   'TOTAL INCOME',                                       '4,25,25,000'],
    ['',   '', ''],
    ['3.', 'Cost of Materials Consumed',                         '2,48,60,000'],
    ['4.', 'Employee Benefit Expenses',                            '38,20,000'],
    ['5.', 'Finance Costs (Interest on CC/TL)',                    '14,85,000'],
    ['6.', 'Depreciation (SLM)',                                    '8,40,000'],
    ['7.', 'Other Expenses (Power, Admin, Repairs)',               '42,30,000'],
    ['',   'TOTAL EXPENSES',                                     '3,52,35,000'],
    ['',   '', ''],
    ['8.', 'Profit Before Tax (PBT)',                              '72,90,000'],
    ['9.', 'Less: Current Tax (@ 25%)',                            '18,22,500'],
    ['10.','Less: Deferred Tax Adjustment',                          '1,15,000'],
    ['11.','Profit After Tax (PAT)',                               '53,52,500'],
  ];

  let iy = 636;
  for (const [sno, desc, amt] of incomeRows) {
    const isBold = desc.startsWith('TOTAL') || desc.startsWith('Profit');
    const fn = isBold ? bold : regular;
    write(p1, fn, 8, 35,  iy, sno);
    write(p1, fn, 8, 55,  iy, desc);
    write(p1, fn, 8, 430, iy, amt);
    iy -= 13;
  }
  line(p1, 30, iy + 5, 565, iy + 5);

  write(p1, bold, 9, 30, iy - 8, 'SCHEDULE BP â€” KEY DISCLOSURES');
  write(p1, regular, 8, 30, iy - 20, 'Payments to Related Parties u/s 40A(2)(b): â‚¹18,60,000 (4.4% of total expenses â€” < 20% threshold)');
  write(p1, regular, 8, 30, iy - 32, 'Deemed dividend u/s 2(22)(e): NIL  |  Donations u/s 80G: â‚¹50,000 (to PM-CARES Fund)');
  write(p1, regular, 8, 30, iy - 44, 'Brought Forward Losses: NIL  |  Unabsorbed Depreciation: NIL');
  write(p1, regular, 8, 30, iy - 56, 'Section 8 Company (CSR obligation): NOT APPLICABLE (Net profit < â‚¹5 Cr threshold)');
  write(p1, regular, 8, 30, iy - 68, 'MAT Applicability: YES â€” Book Profit u/s 115JB: â‚¹72,90,000 | MAT @ 15%: â‚¹10,93,500');
  write(p1, regular, 8, 30, iy - 80, 'MAT Credit Entitlement: â‚¹7,29,000 (carried forward for 15 AYs)');

  write(p1, bold, 9, 30, iy - 96,  'KEY FINANCIAL RATIOS (as filed)');
  write(p1, regular, 8, 30, iy - 108, 'Net Profit Margin: 12.68%  |  EBITDA: â‚¹96,15,000 (22.8% of revenue)  |  Debt/Equity: 1.42');
  write(p1, regular, 8, 30, iy - 120, 'Current Ratio: 1.85  |  Interest Coverage Ratio (ICR): 5.91x  |  DSCR: 2.34');

  const bytes = await doc.save();
  writeFileSync(`${OUT}/itr.pdf`, bytes);
  console.log('âœ“ itr.pdf');
}

// â”€â”€ 4. BALANCE SHEET + P&L â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function makeBalanceSheet() {
  const { doc, regular, bold } = await newDoc();

  const p1 = addPage(doc);
  rect(p1, 0, 792, 595, 50, rgb(0.20, 0.20, 0.50));
  write(p1, bold,    14, 30, 808, 'AUDITED FINANCIAL STATEMENTS', rgb(1,1,1));
  write(p1, regular,  9, 30, 793, `${CO.name} | FY 2023-24 (Year ended 31 March 2024)`, rgb(1,1,1));

  write(p1, bold, 10, 30, 768, 'BALANCE SHEET AS AT 31 MARCH 2024');
  line(p1, 30, 764, 565, 764);

  // Two-column layout
  // LEFT: Equity & Liabilities
  write(p1, bold, 9, 30, 752, 'EQUITY AND LIABILITIES');
  const liabRows = [
    ['Share Capital',                    '50,00,000'],
    ['Reserves & Surplus (Retained)',    '1,18,42,500'],
    ['EQUITY SUBTOTAL',                  '1,68,42,500'],
    ['',                                 ''],
    ['Term Loan â€” SBI (secured)',        '95,00,000'],
    ['Cash Credit / OD â€” SBI',          '68,30,000'],
    ['MSME Loan â€” SIDBI',               '22,00,000'],
    ['NON-CURRENT LIABILITIES',         '1,17,00,000'],
    ['',                                 ''],
    ['Trade Payables (< 6 months)',      '48,60,000'],
    ['Other Current Liabilities',        '12,30,000'],
    ['Provisions (Tax, Gratuity)',        '8,45,000'],
    ['CURRENT LIABILITIES',              '69,35,000'],
    ['',                                 ''],
    ['TOTAL EQUITY & LIABILITIES',      '3,54,77,500'],
  ];

  let ly = 738;
  for (const [desc, amt] of liabRows) {
    const isBold = desc.includes('SUBTOTAL') || desc.includes('LIABILITIES') || desc.includes('TOTAL');
    write(p1, isBold ? bold : regular, 8, 35,  ly, desc);
    write(p1, isBold ? bold : regular, 8, 230, ly, amt);
    ly -= 13;
  }

  // RIGHT: Assets
  write(p1, bold, 9, 310, 752, 'ASSETS');
  const assetRows = [
    ['Plant & Machinery (Net)',          '82,60,000'],
    ['Land & Building',                  '45,00,000'],
    ['Capital WIP',                       '8,00,000'],
    ['NON-CURRENT ASSETS',              '1,35,60,000'],
    ['',                                 ''],
    ['Inventories (RM + WIP + FG)',      '98,40,000'],
    ['Trade Receivables (< 90 days)',    '89,20,000'],
    ['Cash & Bank Balances',             '30,25,000'],
    ['Short-term Loans & Advances',       '1,32,500'],
    ['CURRENT ASSETS',                  '2,19,17,500'],
    ['',                                 ''],
    ['TOTAL ASSETS',                    '3,54,77,500'],
  ];
  let ay = 738;
  for (const [desc, amt] of assetRows) {
    const isBold = desc.includes('ASSETS') || desc.includes('TOTAL');
    write(p1, isBold ? bold : regular, 8, 315, ay, desc);
    write(p1, isBold ? bold : regular, 8, 500, ay, amt);
    ay -= 13;
  }

  line(p1, 30, Math.min(ly, ay) - 2, 565, Math.min(ly, ay) - 2);

  // P&L summary
  const plY = Math.min(ly, ay) - 18;
  write(p1, bold, 10, 30, plY, 'STATEMENT OF PROFIT & LOSS (FY 2023-24)');
  line(p1, 30, plY - 4, 565, plY - 4);

  const plRows = [
    ['Revenue from Operations',          '4,21,80,000',  '3,68,40,000'],
    ['Other Income',                        '3,45,000',     '2,80,000'],
    ['TOTAL INCOME',                     '4,25,25,000',  '3,71,20,000'],
    ['Cost of Materials',                '2,48,60,000',  '2,18,30,000'],
    ['Employee Costs',                     '38,20,000',    '33,60,000'],
    ['Finance Costs',                      '14,85,000',    '13,20,000'],
    ['Depreciation',                        '8,40,000',     '8,40,000'],
    ['Other Expenses',                     '42,30,000',    '38,50,000'],
    ['TOTAL EXPENSES',                   '3,52,35,000',  '3,12,00,000'],
    ['Profit Before Tax',                  '72,90,000',    '59,20,000'],
    ['Tax Expense (Current + Def)',        '19,37,500',    '16,50,000'],
    ['PROFIT AFTER TAX',                   '53,52,500',    '42,70,000'],
  ];
  rect(p1, 30, plY - 20, 535, 14, rgb(0.88, 0.88, 0.96));
  write(p1, bold, 8, 35,  plY - 18, 'Particulars');
  write(p1, bold, 8, 350, plY - 18, 'FY 2023-24 (â‚¹)');
  write(p1, bold, 8, 470, plY - 18, 'FY 2022-23 (â‚¹)');
  let plr = plY - 32;
  for (const [desc, cur, prev] of plRows) {
    const isBold = desc.startsWith('TOTAL') || desc.startsWith('Profit') || desc.startsWith('PROFIT');
    write(p1, isBold ? bold : regular, 8, 35,  plr, desc);
    write(p1, isBold ? bold : regular, 8, 350, plr, cur);
    write(p1, isBold ? bold : regular, 8, 470, plr, prev);
    plr -= 13;
  }

  write(p1, regular, 7, 30, plr - 10,
    'For M/s Joshi & Co., Chartered Accountants (Reg. 123456W) â€” Audit Report dated 28-Sep-2024. ' +
    'True and fair view as per Ind AS / Companies Act 2013.');

  const bytes = await doc.save();
  writeFileSync(`${OUT}/balance-sheet.pdf`, bytes);
  console.log('âœ“ balance-sheet.pdf');
}

// â”€â”€ 5. CIBIL REPORT (CMR) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function makeCIBILReport() {
  const { doc, regular, bold } = await newDoc();

  const p1 = addPage(doc);
  rect(p1, 0, 792, 595, 50, rgb(0.80, 0.40, 0.00));
  write(p1, bold,    14, 30, 808, 'CIBIL TRANSUNION â€” COMMERCIAL CREDIT REPORT', rgb(1,1,1));
  write(p1, regular,  8, 30, 793, 'Confidential | cibil.com | Report generated: 01-Mar-2024', rgb(1,1,1));

  write(p1, bold, 11, 30, 766, 'CMR RANK (CIBIL MSME RANK)');
  rect(p1, 30, 740, 100, 36, rgb(0.05, 0.60, 0.05));
  write(p1, bold,    24, 52, 750, '4', rgb(1,1,1));
  write(p1, regular,  8, 140, 762, 'CMR Rank 4 of 10 â€” LOW-TO-MEDIUM RISK');
  write(p1, regular,  8, 140, 750, 'Probability of Default (12-month): 3.2%  |  Peer Percentile: 73rd');
  write(p1, regular,  8, 140, 738, 'CMR Scale: 1 (Best) â€” 10 (Highest Risk). CMR is NOT a credit score (300-900).');
  line(p1, 30, 732, 565, 732);

  write(p1, bold, 10, 30, 720, 'COMPANY PROFILE');
  write(p1, regular, 9, 30, 708, `Legal Name: ${CO.name}`);
  write(p1, regular, 9, 30, 696, `PAN: ${CO.pan}  |  CIN: ${CO.cin}`);
  write(p1, regular, 9, 30, 684, `Constitution: Private Limited Company  |  Industry: Textile Manufacturing (NIC 131)`);
  write(p1, regular, 9, 30, 672, `Date of Incorporation: 12-Mar-2018  |  Years in Operation: 6`);
  line(p1, 30, 666, 565, 666);

  write(p1, bold, 10, 30, 654, 'CREDIT FACILITIES SUMMARY');
  rect(p1, 30, 636, 535, 14, rgb(0.98, 0.92, 0.80));
  write(p1, bold, 8, 35,  638, 'Lender');
  write(p1, bold, 8, 160, 638, 'Facility Type');
  write(p1, bold, 8, 260, 638, 'Sanctioned (â‚¹)');
  write(p1, bold, 8, 360, 638, 'Outstanding (â‚¹)');
  write(p1, bold, 8, 450, 638, 'DPD (Days Past Due)');
  write(p1, bold, 8, 530, 638, 'Status');

  const loans = [
    ['SBI, Bhiwandi',   'Cash Credit / OD', '1,00,00,000', '68,30,000', '0',  'ACTIVE'],
    ['SBI, Bhiwandi',   'Term Loan',         '1,20,00,000', '95,00,000', '0',  'ACTIVE'],
    ['SIDBI',           'MSME Loan',          '25,00,000',  '22,00,000', '0',  'ACTIVE'],
    ['HDFC Bank',       'Business Loan (CL)', '15,00,000',   '0',        '0',  'CLOSED (2022)'],
    ['Axis Bank',       'LC / BG Facility',   '20,00,000',   '8,40,000', '0',  'ACTIVE'],
  ];

  let lY = 622;
  for (const [lender, ftype, sanc, out, dpd, status] of loans) {
    write(p1, regular, 7, 35,  lY, lender);
    write(p1, regular, 7, 160, lY, ftype);
    write(p1, regular, 7, 260, lY, sanc);
    write(p1, regular, 7, 360, lY, out);
    write(p1, regular, 7, 450, lY, dpd);
    write(p1, regular, 7, 530, lY, status);
    lY -= 13;
  }
  line(p1, 30, lY + 5, 565, lY + 5);
  write(p1, bold, 8, 35,  lY - 5, 'Total Exposure');
  write(p1, bold, 8, 260, lY - 5, '1,80,00,000');
  write(p1, bold, 8, 360, lY - 5, '1,93,70,000');

  write(p1, bold, 9, 30, lY - 20, 'REPAYMENT TRACK RECORD (LAST 24 MONTHS)');
  write(p1, regular, 8, 30, lY - 32,
    'SBI CC/OD: â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  (24/24 months â€” 0 DPD, 0 bounces)');
  write(p1, regular, 8, 30, lY - 44,
    'SBI TL   : â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  (24/24 EMIs paid on time â€” 0 DPD)');
  write(p1, regular, 8, 30, lY - 56,
    'SIDBI    : â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  (24/24 on time â€” 0 DPD)');
  write(p1, regular, 8, 30, lY - 68, 'Cheque Bounces (CC account): 0 (Nil) in last 24 months');
  write(p1, regular, 8, 30, lY - 80, 'Restructured Accounts: NONE  |  Written-off Accounts: NONE  |  Suit Filed: NO');
  write(p1, regular, 8, 30, lY - 92, 'Wilful Defaulter List: NOT LISTED  |  RBI Defaulter List: NOT LISTED');

  write(p1, bold, 9, 30, lY - 108, 'PROMOTER / DIRECTOR CREDIT DETAILS');
  write(p1, regular, 8, 30, lY - 120, `${CO.promoter} â€” Personal CIBIL Score: 768 / 900 (GOOD)`);
  write(p1, regular, 8, 30, lY - 132, 'Personal guarantees given: SBI CC/OD and Term Loan. No personal DPD in last 36 months.');
  write(p1, regular, 8, 30, lY - 144, 'Co-Director: Mrs. Priya Sharma (DIN: 08234567) â€” CIBIL: 742 / 900');

  write(p1, bold, 9, 30, lY - 160, 'ENQUIRIES (LAST 6 MONTHS)');
  write(p1, regular, 8, 30, lY - 172, '1. IDFC First Bank â€” Term Loan enquiry â€” 15-Jan-2024 (NEW LENDER PROSPECTING)');
  write(p1, regular, 8, 30, lY - 184, '2. Axis Bank â€” Working Capital â€” 20-Feb-2024');
  write(p1, regular, 7, 30, lY - 200,
    'DISCLAIMER: This report is generated by CIBIL TransUnion for authorised use only. ' +
    'Reproduction is prohibited. Report ID: CTU-2024-MH-8847263.');

  const bytes = await doc.save();
  writeFileSync(`${OUT}/cibil-report.pdf`, bytes);
  console.log('âœ“ cibil-report.pdf');
}

// â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

(async () => {
  console.log('Generating sample Indian corporate lending documents...\n');
  await makeBankStatement();
  await makeGstReturn();
  await makeITR();
  await makeBalanceSheet();
  await makeCIBILReport();
  console.log(`\nAll 5 documents generated in ./${OUT}/`);
  console.log('\nFictional company: Sharma Textile Industries Pvt. Ltd.');
  console.log('GSTIN: 27AABCS9999K1ZV | PAN: AABCS9999K | CMR Rank: 4');
  console.log('Loan request: â‚¹1.5 Cr term loan\n');
  console.log('Next steps:');
  console.log('  1. Go to http://localhost:3000/applications/new');
  console.log('  2. Fill the form and upload these PDFs in the Documents step');
  console.log('  3. Or test directly:');
  console.log('     node scripts/test-upload.mjs sample-documents/bank-statement.pdf bank_statement');
})();
