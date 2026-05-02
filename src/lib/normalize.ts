/** Remove diacritics and lowercase — enables accent-insensitive search */
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
