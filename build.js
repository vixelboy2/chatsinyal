const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'js', 'supabase.template.js');
const outputPath = path.join(__dirname, 'js', 'supabase.js');

try {
  let code = fs.readFileSync(templatePath, 'utf8');

  // Basic .env parser for local testing
  const envPath = path.join(__dirname, '.env');
  let localEnv = {};
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        localEnv[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
  }

  // Replace the placeholders with actual environment variables
  const url = process.env.SUPABASE_URL || localEnv.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
  const key = process.env.SUPABASE_ANON_KEY || localEnv.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

  code = code.replace('__SUPABASE_URL__', url);
  code = code.replace('__SUPABASE_ANON_KEY__', key);

  fs.writeFileSync(outputPath, code);
  console.log('Successfully injected Supabase credentials into js/supabase.js');

  // Vercel expects an output directory (like "public") when a build script exists.
  // We will copy our static files to a "public" folder so Vercel can serve them.
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  
  // Node 16.7+ feature to recursively copy directories
  fs.cpSync(path.join(__dirname, 'index.html'), path.join(publicDir, 'index.html'));
  fs.cpSync(path.join(__dirname, 'css'), path.join(publicDir, 'css'), { recursive: true });
  fs.cpSync(path.join(__dirname, 'js'), path.join(publicDir, 'js'), { recursive: true });
  
  console.log('Successfully copied files to public/ directory for Vercel.');
} catch (e) {
  console.error('Build script failed:', e);
  process.exit(1);
}
