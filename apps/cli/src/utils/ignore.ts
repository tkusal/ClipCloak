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
  '*.jpg',
  '*.png',
  '*.mp4',
  '*.zip',
  '*.tar.gz', // Common binaries
];

export function getIgnoreFilter(cwd: string, extraIgnores: string[] = []) {
  const ig = ignore().add(DEFAULT_IGNORES);

  if (extraIgnores.length > 0) {
    ig.add(extraIgnores);
  }

  const ignoreFilePath = path.join(cwd, '.clipcloakignore');

  if (fs.existsSync(ignoreFilePath)) {
    const ignoreContent = fs.readFileSync(ignoreFilePath, 'utf8');
    ig.add(ignoreContent);
  }

  return ig;
}

export function walkDir(dir: string, ig: ReturnType<typeof ignore>, cwd: string): string[] {
  const results: string[] = [];
  let list: string[] = [];

  try {
    list = fs.readdirSync(dir);
  } catch (err: unknown) {
    if ((err as any).code === 'EACCES' || (err as any).code === 'EPERM') {
      console.warn(`[WARN] Permission denied: ${dir}`);
      return results;
    }
    throw err;
  }

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(cwd, fullPath);

    if (ig.ignores(relPath)) continue;

    try {
      const stat = fs.lstatSync(fullPath);

      // Skip symlinks to avoid infinite loops and scanning external files
      if (stat.isSymbolicLink()) {
        continue;
      }

      if (stat.isDirectory()) {
        // Recurse
        results.push(...walkDir(fullPath, ig, cwd));
      } else if (stat.isFile()) {
        results.push(fullPath);
      }
    } catch (err: unknown) {
      if ((err as any).code === 'EACCES' || (err as any).code === 'EPERM' || (err as any).code === 'ENOENT') {
        console.warn(`[WARN] Skipping unreadable file/directory: ${fullPath}`);
        continue;
      }
      throw err;
    }
  }

  return results;
}
