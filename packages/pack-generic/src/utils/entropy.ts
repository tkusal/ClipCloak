export function shannonEntropy(str: string): number {
  if (!str) return 0;
  const map: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    map[char] = (map[char] || 0) + 1;
  }

  let entropy = 0;
  for (const char in map) {
    const p = map[char] / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function isObviousDummyString(str: string): boolean {
  const lower = str.toLowerCase();

  if (
    lower.includes('example') ||
    lower.includes('dummy') ||
    lower.includes('fake') ||
    lower.includes('your_') ||
    lower.includes('xxxx') ||
    lower === 'pass' ||
    lower === 'password' ||
    lower === 'secret' ||
    lower.includes('00000000') ||
    /^([a-z0-9])\1+$/.test(lower.replace(/[^a-z0-9]/g, '')) // Repeated characters ignoring punctuation
  ) {
    return true;
  }
  return false;
}

export function isSoftDummyString(str: string): boolean {
  const lower = str.toLowerCase();
  if (lower.includes('12345678') || lower.includes('abcdef')) {
    return true;
  }
  return false;
}

export function isDummyString(str: string): boolean {
  return isObviousDummyString(str) || isSoftDummyString(str);
}
