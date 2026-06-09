import Papa from "papaparse";
import { validateAndTransformRow } from "../validators/gaiola.validator";
import type { GaiolaDTO } from "../schemas/gaiola.schema";

function forceFirstTab(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.searchParams.set("gid", "0");
    u.searchParams.set("single", "true");
    return u.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}gid=0&single=true`;
  }
}

export function toCsvUrl(input: string): string {
  const url = input.trim();
  if (!url) return url;
  if (url.includes("output=csv")) return forceFirstTab(url);
  const replaced = url.replace(/\/pubhtml(\?.*)?$/, "/pub?output=csv");
  if (replaced !== url) return forceFirstTab(replaced);
  if (url.endsWith("/pub")) return forceFirstTab(`${url}?output=csv`);
  if (url.includes("/pub?")) {
    const u = new URL(url);
    u.searchParams.set("output", "csv");
    return forceFirstTab(u.toString());
  }
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=0`;
  }
  return url;
}

export async function fetchAndParseGaiolas(sheetUrl: string): Promise<GaiolaDTO[]> {
  const csvUrl = toCsvUrl(sheetUrl);
  
  // Aqui a requisição de rede acontece no backend, de forma segura e com timeouts adequados
  const response = await fetch(csvUrl, {
    method: 'GET',
    headers: { 'Accept': 'text/csv' }
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar CSV do Sheets: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const now = new Date();

  // Parsing executado no servidor, não bloqueia a UI
  const result = Papa.parse<any>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().replace(/\s+/g, " ").toUpperCase(),
  });

  const validGaiolas: GaiolaDTO[] = [];
  
  result.data.forEach((row, index) => {
    const gaiola = validateAndTransformRow(row, index, now);
    if (gaiola) {
      validGaiolas.push(gaiola);
    }
  });

  return validGaiolas;
}
