/**
 * Endpoint de diagnóstico — testa conectividade com Google Sheets
 * Acesse: /api/health
 */
export default async function handler(req: any, res: any) {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjskf_bcAvlozuoG61KdPqfLa4nnka5hsqUtIq0hIEwEjGIvgkH0rvZ68TJllw6ufQjlRil71L6KZI/pub?output=csv&gid=0&single=true";

  try {
    const response = await fetch(sheetUrl, {
      method: "GET",
      headers: { Accept: "text/csv" },
    });

    const status = response.status;
    const ok = response.ok;
    const text = ok ? (await response.text()).slice(0, 200) : null;

    return res.status(200).json({
      runtime: "nodejs",
      sheetFetch: { status, ok, preview: text },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(200).json({
      runtime: "nodejs",
      sheetFetch: { error: error?.message },
      timestamp: new Date().toISOString(),
    });
  }
}
