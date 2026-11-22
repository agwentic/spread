const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];

export function fmt(n: number, digits = 1): string {
  if (!isFinite(n)) return '∞';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return sign + (n < 10 && n % 1 ? n.toFixed(digits) : Math.floor(n).toString());
  const tier = Math.min(SUFFIX.length - 1, Math.floor(Math.log10(n) / 3));
  return sign + (n / 10 ** (tier * 3)).toFixed(2) + SUFFIX[tier];
}

export function fmtRate(n: number): string {
  if (Math.abs(n) < 0.005) return '';
  return (n > 0 ? '+' : '') + fmt(n, 2) + '/s';
}

export function fmtTime(sec: number): string {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
}
