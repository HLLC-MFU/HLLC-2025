export function getLastUpdatedAt<T extends { updatedAt?: any; createdAt?: any }>(
    docs: T[]
  ): string {
    if (!docs.length) return new Date().toISOString();
  
    const latest = docs.reduce((latest, doc) => {
      const updated = new Date(doc.updatedAt ?? doc.createdAt ?? 0);
      return updated > latest ? updated : latest;
    }, new Date(0));
  
    return latest.toISOString();
  }
  