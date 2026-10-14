export class CatalogError extends Error {
  /** @param {string} message @param {number} [status] */
  constructor(message,status=400){super(message);this.status=status;}
}
/** @param {unknown} value */
export function catalogName(value) {
  if(typeof value!=='string')throw new CatalogError('Enter a name.');
  const name=value.normalize('NFKC').trim().replace(/\s+/g,' ');
  if(!name || name.length>80)throw new CatalogError('Names must contain 1–80 characters.');
  return {name,nameKey:name.toLocaleLowerCase('en-US')};
}
/** @param {unknown} value */
export function catalogIds(value,limit=20) {
  if(!Array.isArray(value)||value.length>limit||value.some(id=>typeof id!=='string'||!id||id.length>100))throw new CatalogError(`Choose up to ${limit} valid entries per group.`);
  return [...new Set(value)];
}
