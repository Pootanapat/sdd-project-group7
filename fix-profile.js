const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/profile.html');

if (!fs.existsSync(file)) {
  console.log('File not found:', file);
  return;
}

let content = fs.readFileSync(file, 'utf-8');
let newContent = '';
let inOurs = false;
let inTheirs = false;

const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('<<<<<<< HEAD')) {
    inOurs = true;
    continue;
  }
  if (line.startsWith('=======')) {
    inOurs = false;
    inTheirs = true;
    continue;
  }
  if (line.startsWith('>>>>>>>')) {
    inTheirs = false;
    continue;
  }

  if (inOurs) {
    newContent += line + '\n';
  } else if (!inTheirs) {
    newContent += line + '\n';
  }
}

if (!content.endsWith('\n') && newContent.endsWith('\n')) {
   newContent = newContent.slice(0, -1);
}

fs.writeFileSync(file, newContent);
console.log('Fixed conflicts in', file);
