import { execSync } from 'child_process';

const envVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_CONVEX_URL',
  'CONVEX_URL',
  'CONVEX_DEPLOYMENT',
  'NEXT_PUBLIC_INSFORGE_URL',
  'NEXT_PUBLIC_INSFORGE_ANON_KEY',
  'INSFORGE_API_KEY',
  'OPENROUTER_API_KEY',
  'DATABASE_URL',
  'JWT_KEY_ID',
  'JWT_SECRET',
  'VERCEL_WEBHOOK_SECRET'
];

const targets = ['production', 'preview', 'development'];

for (const key of envVars) {
  const value = process.env[key];
  if (!value) {
    console.log(`Skipping missing env var: ${key}`);
    continue;
  }
  for (const target of targets) {
    try {
      console.log(`Setting ${key} for ${target}...`);
      execSync(`cmd /c "echo ${value} | pnpm dlx vercel env add ${key} ${target}"`, { stdio: 'ignore' });
    } catch (e) {
      console.log(`Skipping or existing key: ${key} (${target})`);
    }
  }
}


console.log('Finished pushing environment variables to Vercel Cloud.');
