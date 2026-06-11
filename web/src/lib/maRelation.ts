function maLabel(H: number): string {
  return `${H}-Day Moving Average`;
}

export function maRelationColumnHeader(H: number): string {
  return `Over/Under ${maLabel(H)}`;
}

export function formatMaRelation(relation: string, H: number): string {
  const ma = maLabel(H);
  if (relation === "below") return `Under ${ma}`;
  if (relation === "above") return `Over ${ma}`;
  if (relation === "at") return `At ${ma}`;
  return relation;
}
