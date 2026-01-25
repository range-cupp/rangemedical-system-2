#!/usr/bin/env node
/**
 * Run this script in your project root:
 * node add-cellular-energy.js
 * 
 * It will update components/RangeMedicalSystem.js with Cellular Energy Reset support
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'RangeMedicalSystem.js');

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error('❌ Could not find components/RangeMedicalSystem.js');
  console.error('   Make sure you run this script from your project root.');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// Change 1: Add Zap to imports
const oldImport = "import { Plus, Search, Calendar, TrendingUp, Users, DollarSign, AlertCircle, Activity, Syringe, Droplet, Sun, Wind, FileText, Bell, ChevronRight, X, Loader, Trash2 } from 'lucide-react';";
const newImport = "import { Plus, Search, Calendar, TrendingUp, Users, DollarSign, AlertCircle, Activity, Syringe, Droplet, Sun, Wind, FileText, Bell, ChevronRight, X, Loader, Trash2, Zap } from 'lucide-react';";

if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  console.log('✅ Added Zap icon to imports');
  changes++;
} else if (content.includes('Zap')) {
  console.log('⏭️  Zap already in imports');
} else {
  console.log('⚠️  Could not find import line to update');
}

// Change 2: Add cellular_energy to protocolTypes
if (!content.includes("cellular_energy: { icon: Zap")) {
  content = content.replace(
    "rlt: { icon: Sun, label: 'Red Light', color: '#000000' }\n  };",
    "rlt: { icon: Sun, label: 'Red Light', color: '#000000' },\n    cellular_energy: { icon: Zap, label: 'Cellular Energy', color: '#000000' }\n  };"
  );
  console.log('✅ Added cellular_energy to protocolTypes');
  changes++;
} else {
  console.log('⏭️  cellular_energy already in protocolTypes');
}

// Change 3: Add cellular_energy to getProtocolStats
if (!content.includes('cellular_energy: 0,\n      total: 0')) {
  content = content.replace(
    'rlt: 0,\n      total: 0',
    'rlt: 0,\n      cellular_energy: 0,\n      total: 0'
  );
  console.log('✅ Added cellular_energy to getProtocolStats');
  changes++;
} else {
  console.log('⏭️  cellular_energy already in getProtocolStats');
}

// Change 4: Add cellular_energy to getRevenueData byType
if (!content.includes("rlt: 0,\n      cellular_energy: 0\n    };")) {
  content = content.replace(
    "rlt: 0\n    };",
    "rlt: 0,\n      cellular_energy: 0\n    };"
  );
  console.log('✅ Added cellular_energy to getRevenueData');
  changes++;
} else {
  console.log('⏭️  cellular_energy already in getRevenueData');
}

// Change 5: Add to Protocol Type dropdown
if (!content.includes('<option value="cellular_energy">')) {
  content = content.replace(
    '<option value="rlt">Red Light Therapy</option>\n                </select>',
    '<option value="rlt">Red Light Therapy</option>\n                  <option value="cellular_energy">Cellular Energy Reset</option>\n                </select>'
  );
  console.log('✅ Added Cellular Energy Reset to dropdown');
  changes++;
} else {
  console.log('⏭️  Cellular Energy Reset already in dropdown');
}

// Change 6: Add to getProtocolIcon switch
if (!content.includes("case 'cellular_energy': return <Zap")) {
  content = content.replace(
    "case 'rlt': return <Sun size={20} />;\n                      default: return <FileText size={20} />;",
    "case 'rlt': return <Sun size={20} />;\n                      case 'cellular_energy': return <Zap size={20} />;\n                      default: return <FileText size={20} />;"
  );
  console.log('✅ Added cellular_energy to getProtocolIcon');
  changes++;
} else {
  console.log('⏭️  cellular_energy already in getProtocolIcon');
}

// Write the updated file
fs.writeFileSync(filePath, content);

console.log('');
console.log(`🎉 Done! Made ${changes} changes to RangeMedicalSystem.js`);
console.log('');
console.log('Cellular Energy Reset is now available in the Protocol Type dropdown.');
console.log('Push to GitHub to deploy: git add . && git commit -m "Add Cellular Energy Reset protocol type" && git push');
