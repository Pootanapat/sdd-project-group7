const fs = require('fs');
const path = require('path');

const files = [
  'frontend/admin.html',
  'backend/server.js',
  'frontend/Signup.html',
  'frontend/booking.html'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
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

  // Remove trailing newline if it wasn't there originally
  if (!content.endsWith('\n') && newContent.endsWith('\n')) {
     newContent = newContent.slice(0, -1);
  }

  fs.writeFileSync(filePath, newContent);
  console.log('Fixed conflicts in', file);
});
