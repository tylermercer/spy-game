export class Stats {
  constructor(
    public headers: string[],
    public data: string[][]
  ) {}
}

export async function getStats(): Promise<Stats> {
  await new Promise((resolve) => setTimeout(resolve, 30000))
  return new Stats(['foo', 'bar'], [['one', '1'], ['two', '2']])
}