// Partial-reveal formatting for contact options — enough for the account
// owner to recognize which inbox/phone a code would go to, without exposing
// the full value to anyone else probing the endpoint.

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const first = local.slice(0, 1);
  const last = local.length > 1 ? local.slice(-1) : '';
  return `${first}***${last}${domain}`;
}

// Masks every digit except the last two, preserving punctuation/spacing
// (e.g. "+57 300 000 0000" -> "+** *** *** **00").
export function maskPhone(phone: string): string {
  const digitPositions: number[] = [];
  for (let i = 0; i < phone.length; i++) if (/\d/.test(phone[i]!)) digitPositions.push(i);
  const visibleFrom = Math.max(digitPositions.length - 2, 0);
  const chars = [...phone];
  digitPositions.forEach((pos, idx) => { if (idx < visibleFrom) chars[pos] = '*'; });
  return chars.join('');
}
