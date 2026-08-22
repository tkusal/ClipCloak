import fs from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';

const DEFAULT_IGNORES = [
  '.git/',
  'node_modules/',
  'dist/',
  'build/',
  'coverage/',
  '.vendor/',
  '*.jpg', '*.png', '*.mp4', '*.zip', '*.tar.gz', // Common binaries
];

export function getIgnoreFilter(cwd: string) {
  const ig = ignore().add(DEFAULT_IGNORES);
  const ignoreFilePath = path.join(cwd, '.clipcloakignore');
  
  if (fs.existsSync(ignoreFilePath)) {
    const ignoreContent = fs.readFileSync(ignoreFilePath, 'utf8');
    ig.add(ignoreContent);
  }
  
  return ig;
}

export function walkDir(dir: string, ig: ReturnType<typeof ignore>, cwd: string): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(cwd, fullPath);
    
    if (ig.ignores(relPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      // Recurse
      results.push(...walkDir(fullPath, ig, cwd));
    } else {
      results.push(fullPath);
    }
  }
  
  return results;
}
