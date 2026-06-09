import Papa from "papaparse";
import { validateAndTransformRow } from "../validators/gaiola.validator";
import type { GaiolaDTO } from "../schemas/gaiola.schema";

function forceSecondTab(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.searchParams.set("gid", "1");
    u.searchParams.set("single", "true");
    return u.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}gid=1&single=true`;
  }
}

export function toProductivityCsvUrl(input: string): string {
  const url = input.trim();
  if (!url) return url;
  if (url.includes("output=csv")) return forceSecondTab(url);
  const replaced = url.replace(/\/pubhtml(\?.*)?$/, "/pub?output=csv");
  if (replaced !== url) return forceSecondTab(replaced);
  if (url.endsWith("/pub")) return forceSecondTab(`${url}?output=csv`);
  if (url.includes("/pub?")) {
    const u = new URL(url);
    u.searchParams.set("output", "csv");
    return forceSecondTab(u.toString());
  }
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=1`;
  }
  return url;
}

async function resolveGidForHistorico(url: string): Promise<string | null> {
  // Se for uma url de exportação direta, tenta achar o pubhtml para resolver o GID
  const pubhtmlUrl = url.replace(/\/pub(\?.*)?$/, "/pubhtml").replace(/\/export(\?.*)?$/, "/pubhtml");
  if (!pubhtmlUrl.includes("/pubhtml")) return null;

  try {
    const res = await fetch(pubhtmlUrl);
    if (!res.ok) return null;
    const html = await res.text();
    
    // Procura por {name: "HISTORICO", gid: "123456"} no código fonte do Google Sheets
    const regex = /\{[^}]*name\s*:\s*\"([^\"]+)\"[^}]*gid\s*:\s*\"?(\d+)\"?/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (match[1].toUpperCase() === "HISTORICO") {
        return match[2]; // Retorna o GID correto
      }
    }
  } catch (err) {
    console.error("Falha ao resolver GID dinâmico para HISTORICO:", err);
  }
  return null;
}

export async function fetchAndParseProductivity(sheetUrl: string): Promise<GaiolaDTO[]> {
  let csvUrl = toProductivityCsvUrl(sheetUrl);
  
  // Tenta resolver dinamicamente o GID da aba "HISTORICO"
  const historicoGid = await resolveGidForHistorico(sheetUrl);
  if (historicoGid) {
    csvUrl = csvUrl.replace(/gid=\d+/, `gid=${historicoGid}`);
  } else {
    console.warn("[ProductivityService] Não foi possível achar a aba HISTORICO dinamicamente. Tentando com gid=1...");
  }
  
  let response = await fetch(csvUrl, {
    method: 'GET',
    headers: { 'Accept': 'text/csv' }
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(`Aba 2 (Produtividade) não encontrada. Verifique se a segunda aba está publicada na web e possui o GID=1. Detalhes: ${response.statusText}`);
    }
    throw new Error(`Falha ao baixar CSV do Sheets (produtividade): ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const now = new Date();

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
