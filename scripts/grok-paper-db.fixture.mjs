// Only imported by the isolated broker adapter integration test.
export async function getSql() {
  if (!globalThis.__grokPaperTestSql) throw new Error("Test SQL not initialized");
  return globalThis.__grokPaperTestSql;
}

export async function withTransaction(fn) {
  if (!globalThis.__grokPaperTestTransaction) throw new Error("Test transaction not initialized");
  return globalThis.__grokPaperTestTransaction(fn);
}
