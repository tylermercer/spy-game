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
    let results: Stats | null = null;
    let done = false;

    setTimeout(() => {
      done = true;
      if (results != null) {
        resolve(results);
      }
    }, 8500);

    try {
      Papa.parse(url, {
        download: true,
        worker: true,
        complete: function(res : ParseResult<unknown>) {
          if (!res){
            reject(new Error("Could not retrieve data. Please check your network connection."))
          }
          else {
            results = new Stats(res.data[0] as string[], res.data.slice(1) as string[][])
            if (done) {
              resolve(results);
            }
          }
        }
      });
    }
    catch (e) {
      reject(e);
    }
  });
}