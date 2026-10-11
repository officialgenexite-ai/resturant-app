export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")  // remove special characters
    .replace(/\s+/g, "-")       // spaces to hyphens
    .replace(/-+/g, "-");       // collapse multiple hyphens
}
