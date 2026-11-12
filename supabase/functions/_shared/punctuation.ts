export function withoutEmDashes(value: string): string {
  return value.replace(/\s*(?:\u2014|&mdash;|&#8212;|&#x2014;)\s*/gi, ' - ');
}