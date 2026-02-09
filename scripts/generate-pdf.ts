#!/usr/bin/env npx ts-node
/**
 * Generate PDF summary of x402-agent-pay
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 }
});

const outputPath = process.argv[2] || './x402-agent-pay-summary.pdf';
doc.pipe(fs.createWriteStream(outputPath));

// Colors
const blue = '#0066cc';
const gray = '#666666';
const darkGray = '#333333';

// Header
doc.fontSize(28).fillColor(blue).text('💸 x402-agent-pay', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(14).fillColor(gray).text('Seamless USDC payments for AI agents using the x402 protocol', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(10).fillColor(blue).text('MIT License  |  x402 Protocol  |  USDC Hackathon 2026', { align: 'center' });
doc.moveDown(1);

// Horizontal line
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(blue).lineWidth(2).stroke();
doc.moveDown(1);

// Executive Summary
doc.fontSize(16).fillColor(blue).text('📋 Executive Summary');
doc.moveDown(0.5);
doc.fontSize(11).fillColor(darkGray).text(
  'x402-agent-pay is a TypeScript library that enables autonomous AI agents to make USDC payments automatically when encountering paid APIs (HTTP 402 responses). Built on Coinbase\'s official @x402/fetch SDK, it adds critical safety guardrails that prevent wallet drain from bugs, prompt injections, or infinite loops.',
  { align: 'justify' }
);
doc.moveDown(1);

// Key Value Prop box
doc.rect(50, doc.y, 495, 50).fillColor('#fff3cd').fill();
doc.fillColor(darkGray).fontSize(10);
doc.text('Key Value Proposition: Purpose-built for autonomous OpenClaw agents with spending controls, velocity limits, and full audit trails — the missing safety layer between AI agents and real money.', 60, doc.y - 40, { width: 475 });
doc.moveDown(1.5);

// Problem & Solution
doc.fontSize(16).fillColor(blue).text('🎯 Problem & Solution');
doc.moveDown(0.5);
doc.fontSize(12).fillColor(darkGray).text('The Problem:', { continued: false });
doc.fontSize(11).fillColor(gray);
doc.list([
  'Bugs can trigger infinite payment loops',
  'Prompt injections can redirect payments to attackers',
  'No visibility into what agents are spending',
  'No way to set spending limits or control recipients'
], { bulletRadius: 2, textIndent: 20 });
doc.moveDown(0.5);

doc.fontSize(12).fillColor(darkGray).text('The Solution:', { continued: false });
doc.fontSize(11).fillColor(gray).text(
  'x402-agent-pay wraps the official Coinbase SDK with policy enforcement that happens before any payment is signed.'
);
doc.moveDown(1);

// Key Features
doc.fontSize(16).fillColor(blue).text('✨ Key Features');
doc.moveDown(0.5);
doc.fontSize(11).fillColor(darkGray);
doc.text('🛡️ Spending Controls', { continued: true }).fillColor(gray).text(' — Per-transaction, daily, weekly, monthly limits');
doc.fillColor(darkGray).text('⚡ Velocity Limits', { continued: true }).fillColor(gray).text(' — Max transactions per hour to prevent loops');
doc.fillColor(darkGray).text('📋 Recipient Controls', { continued: true }).fillColor(gray).text(' — Whitelist + blacklist for approved addresses');
doc.fillColor(darkGray).text('📜 Audit Trail', { continued: true }).fillColor(gray).text(' — Every payment attempt logged with full details');
doc.fillColor(darkGray).text('🔌 Official SDK', { continued: true }).fillColor(gray).text(' — Built on Coinbase\'s @x402/fetch');
doc.moveDown(1);

// Feature Comparison Table
doc.fontSize(16).fillColor(blue).text('📊 Feature Comparison');
doc.moveDown(0.5);

const tableTop = doc.y;
const tableLeft = 50;
const colWidths = [180, 120, 195];
const rowHeight = 25;

// Table header
doc.rect(tableLeft, tableTop, 495, rowHeight).fillColor('#f5f5f5').fill();
doc.fillColor(darkGray).fontSize(10);
doc.text('Feature', tableLeft + 5, tableTop + 8);
doc.text('Raw @x402/fetch', tableLeft + colWidths[0] + 5, tableTop + 8);
doc.text('x402-agent-pay', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 8);

// Table rows
const rows = [
  ['Auto-402 handling', '✅', '✅'],
  ['Spending limits', '❌', '✅ Per-tx, daily, weekly, monthly'],
  ['Velocity limits', '❌', '✅ Max tx/hour'],
  ['Recipient controls', '❌', '✅ Whitelist + blacklist'],
  ['Receipt logging', '❌', '✅ Full audit trail'],
  ['Policy enforcement', '❌', '✅ Block before signing'],
];

let yPos = tableTop + rowHeight;
rows.forEach(row => {
  doc.fillColor(gray).fontSize(9);
  doc.text(row[0], tableLeft + 5, yPos + 8);
  doc.text(row[1], tableLeft + colWidths[0] + 5, yPos + 8);
  doc.text(row[2], tableLeft + colWidths[0] + colWidths[1] + 5, yPos + 8);
  yPos += rowHeight;
});

// Draw table borders
doc.strokeColor('#ddd').lineWidth(0.5);
for (let i = 0; i <= rows.length + 1; i++) {
  doc.moveTo(tableLeft, tableTop + i * rowHeight).lineTo(tableLeft + 495, tableTop + i * rowHeight).stroke();
}
doc.moveTo(tableLeft, tableTop).lineTo(tableLeft, yPos).stroke();
doc.moveTo(tableLeft + colWidths[0], tableTop).lineTo(tableLeft + colWidths[0], yPos).stroke();
doc.moveTo(tableLeft + colWidths[0] + colWidths[1], tableTop).lineTo(tableLeft + colWidths[0] + colWidths[1], yPos).stroke();
doc.moveTo(tableLeft + 495, tableTop).lineTo(tableLeft + 495, yPos).stroke();

doc.y = yPos + 15;
doc.moveDown(1);

// Technical Stack
doc.fontSize(16).fillColor(blue).text('🔧 Technical Stack');
doc.moveDown(0.5);
doc.fontSize(10).fillColor(gray);
doc.list([
  'Language: TypeScript',
  'SDK: @x402/fetch, @x402/evm, @x402/core (official Coinbase)',
  'Blockchain: viem for Ethereum interactions',
  'Networks: Base, Ethereum, Arbitrum, Optimism, Polygon + testnets',
  'Testing: 29 unit tests passing with Vitest'
], { bulletRadius: 2, textIndent: 20 });
doc.moveDown(1);

// Security
doc.fontSize(16).fillColor(blue).text('🔐 Security Model');
doc.moveDown(0.5);
doc.fontSize(10).fillColor(gray);
doc.list([
  'Private keys never logged or transmitted',
  'Policy enforcement happens before any transaction is signed',
  'Blacklist checked before whitelist (security priority)',
  'Full audit trail enables post-hoc review',
  'Built on audited Coinbase SDK infrastructure'
], { bulletRadius: 2, textIndent: 20 });
doc.moveDown(1);

// Links
doc.fontSize(16).fillColor(blue).text('🔗 Links');
doc.moveDown(0.5);
doc.fontSize(10).fillColor(blue);
doc.text('GitHub: https://github.com/Omnivalent/x402-agent-pay');
doc.text('x402 Protocol: https://x402.org');
doc.text('Coinbase SDK: https://github.com/coinbase/x402');
doc.moveDown(1);

// Footer
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
doc.moveDown(0.5);
doc.fontSize(10).fillColor(gray).text('Built by ClawMD 🩺 | February 2026 | MIT License', { align: 'center' });

doc.end();
console.log(`PDF generated: ${outputPath}`);
