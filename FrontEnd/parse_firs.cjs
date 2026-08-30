const fs = require('fs');
const content = fs.readFileSync('c:/Users/dell/.vscode/Works/Lumina/DataBase/synthetic/firs.csv', 'utf8');

const lines = content.trim().split('\n');
const rows = [];

for (let i = 1; i < lines.length && rows.length < 350; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const cols = [];
  let cur = '';
  let inQuote = false;
  for (let c = 0; c < line.length; c++) {
    const ch = line[c];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  
  if (cols.length >= 8) {
    const lat = parseFloat(cols[6]);
    const lng = parseFloat(cols[7]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= 11 && lat <= 19 && lng >= 74 && lng <= 79) {
      rows.push({
        ROWID: parseInt(cols[0]) || i,
        ID: parseInt(cols[0]) || i,
        Station_ID: parseInt(cols[1]) || 1,
        FIR_Number: cols[2] || 'FIR-' + i,
        Date: cols[3] || '2026-01-01',
        Crime_Group: cols[4] || 'Crime',
        Crime_Subgroup: cols[5] || '',
        Latitude: lat,
        Longitude: lng,
        Narrative: (cols[8] || '').replace(/^"|"$/g, ''),
        Status: cols[9] || 'Under Investigation'
      });
    }
  }
}

fs.writeFileSync('c:/Users/dell/.vscode/Works/Lumina/FrontEnd/src/components/lumina/live-firs.json', JSON.stringify(rows, null, 2));
console.log('Saved ' + rows.length + ' FIRs to live-firs.json');
