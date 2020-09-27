import Papa, {ParseResult} from 'papaparse'

export class Stats {
  constructor(
    public headers: string[],
    public data: string[][]
  ) {}
}

const url = `https://docs.google.com/spreadsheets/d/1F9e_bXrYdjqQktGFT6lkqaU9QYeJ92Q9hh9lUwhhQqc/gviz/tq?tqx=out:csv&sheet=frontend`;

export async function getStats(): Promise<Stats> {
  return new Promise((resolve, reject) => {
    console.log("starting");
    Papa.parse(url, {
      download: true,
      complete: function(results : ParseResult<unknown>) {
        console.log(results);
        resolve(new Stats(results.data[0] as string[], results.data.slice(1) as string[][]));
      }
    });
  })
}