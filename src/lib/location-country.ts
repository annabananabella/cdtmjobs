export function locationCountryLabel(country: string): string {
  const value = country.trim();
  if (/^(usa|us|u\.s\.?a?\.?|united states(?: of america)?)$/i.test(value)) return "USA";
  if (/^(de|deutschland|germany)$/i.test(value)) return "Germany";
  return value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}