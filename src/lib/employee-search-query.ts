/**
 * Employee list APIs apply `documentNumber` and `search` with AND — send only one.
 * Document-style input → documentNumber; name-like input → search (blind index on names).
 */
export function splitEmployeeSearchQuery(query: string): {
  search?: string;
  documentNumber?: string;
} {
  const q = query.trim();
  if (!q) {
    return {};
  }
  if (/[\p{L}]{2,}/u.test(q)) {
    return { search: q };
  }
  if (/^[\d.\-\sKk]+$/u.test(q) && /\d/.test(q)) {
    return { documentNumber: q };
  }
  return { search: q };
}
