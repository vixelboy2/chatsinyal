const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'js', 'supabase.template.js');
const outputPath = path.join(__dirname, 'js', 'supabase.js');

try {
  let code = fs.readFileSync(templatePath, 'utf8');

  // Replace the placeholders with actual environment variables
  // If running locally without .env, you should set them in your terminal
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

  code = code.replace('__SUPABASE_URL__', url);
  code = code.replace('__SUPABASE_ANON_KEY__', key);

  fs.writeFileSync(outputPath, code);
  console.log('Successfully injected Supabase credentials into js/supabase.js');
} catch (e) {
  console.error('Build script failed:', e);
  process.exit(1);
}
