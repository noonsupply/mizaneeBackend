/** Logs temporaires pour diagnostiquer les getAll (retirer une fois le flux validé). */
export function logGetAll(resource: string, foyerId: string, count: number): void {
  console.log(`[getAll:${resource}] foyerId utilisé:`, foyerId);
  console.log(`[getAll:${resource}] nb documents trouvés:`, count);
}
