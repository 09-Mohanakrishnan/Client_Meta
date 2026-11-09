import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('./data_imports').filter(f => f.endsWith('.csv'));

function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentRow.length > 0 || currentField !== '') {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

for (const file of files) {
  const content = fs.readFileSync(path.join('./data_imports', file), 'utf-8');
  const rows = parseCSV(content);
  const header = rows[0];
  const dataRows = rows.slice(1);

  console.log('\n========================================');
  console.log('FILE:', file);
  console.log('Total rows:', dataRows.length);
  console.log('Headers:', header);

  let activeCount = 0;
  let totalImp = 0;
  let totalReach = 0;
  let totalSpent = 0;
  let totalResults = 0;

  const startsIdx = header.indexOf('Reporting starts');
  const endsIdx = header.indexOf('Reporting ends');
  const nameIdx = header.indexOf('Campaign name');
  const deliveryIdx = header.indexOf('Campaign delivery');
  const impIdx = header.indexOf('Impressions');
  const reachIdx = header.indexOf('Reach');
  const budgetIdx = header.indexOf('Ad set budget');
  const budgetTypeIdx = header.indexOf('Ad set budget type');
  const spentIdx = header.indexOf('Amount spent (INR)');
  const resultsIdx = header.indexOf('Total messaging contacts') !== -1 ? header.indexOf('Total messaging contacts') : -1;

  const sampleStarts = dataRows[0]?.[startsIdx];
  const sampleEnds = dataRows[0]?.[endsIdx];
  console.log('Date Range:', sampleStarts, 'to', sampleEnds);

  dataRows.forEach(r => {
    const delivery = r[deliveryIdx];
    if (delivery === 'active') activeCount++;
    const imp = parseFloat(r[impIdx]) || 0;
    const reach = parseFloat(r[reachIdx]) || 0;
    const spent = parseFloat(r[spentIdx]) || 0;
    const res = resultsIdx !== -1 ? (parseFloat(r[resultsIdx]) || 0) : 0;

    totalImp += imp;
    totalReach += reach;
    totalSpent += spent;
    totalResults += res;
  });

  console.log('Active campaigns:', activeCount, 'out of', dataRows.length);
  console.log('Total Impressions:', totalImp.toLocaleString('en-IN'));
  console.log('Total Reach:', totalReach.toLocaleString('en-IN'));
  console.log('Total Amount Spent:', totalSpent.toFixed(2));
  console.log('Total Results:', totalResults);

  // List campaigns with non-zero delivery
  const withDelivery = dataRows.filter(r => (parseFloat(r[impIdx]) || 0) > 0 || (parseFloat(r[spentIdx]) || 0) > 0);
  console.log('Campaigns with delivery:', withDelivery.length);
  withDelivery.forEach(r => {
    console.log(`  - "${r[nameIdx]}": Delivery=${r[deliveryIdx]}, Budget=${r[budgetIdx]}, Imp=${r[impIdx]}, Reach=${r[reachIdx]}, Spent=${r[spentIdx]}`);
  });
}

