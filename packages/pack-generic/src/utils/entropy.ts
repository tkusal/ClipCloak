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

export function isDummyString(str: string): boolean {
  const lower = str.toLowerCase();
  
  // Exact or obvious mock matches
  if (lower.includes('example') || 
      lower.includes('dummy') || 
      lower.includes('fake') || 
      lower.includes('your_') || 
      lower.includes('xxxx') ||
      lower.includes('12345678') ||
      lower.includes('abcdef') ||
      lower === 'pass' ||
      lower === 'password' ||
      lower === 'secret' ||
      /^([a-z0-9])\1+$/.test(lower) // Repeated characters like 'aaaaa' or '00000000000'
  ) {
    return true;
  }
  
  return false;
}
