const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjskf_bcAvlozuoG61KdPqfLa4nnka5hsqUtIq0hIEwEjGIvgkH0rvZ68TJllw6ufQjlRil71L6KZI/pubhtml";

fetch(url)
  .then(r => r.text())
  .then(html => {
    // The google sheets pubhtml has a window._docs_flag_cek or similar, but the sheet names and GIDs are usually in an array of objects
    // like {name: "HISTORICO", gid: "123456"}
    const regex = /\{[^}]*name\s*:\s*\"([^\"]+)\"[^}]*gid\s*:\s*\"?(\d+)\"?/g;
    let match;
    const sheets = [];
    while ((match = regex.exec(html)) !== null) {
      sheets.push({ name: match[1], gid: match[2] });
    }
    
    // If not found, try another regex
    if (sheets.length === 0) {
       // Look for gid=12345 and names nearby
       const gidRegex = /gid=(\d+)/g;
       const gids = html.match(gidRegex);
       console.log("Raw GIDs:", gids);
       
       const titleRegex = /<li[^>]*id="sheet-button-[^>]*><a[^>]*>(.*?)<\/a>/g;
       const titles = [];
       let tMatch;
       while ((tMatch = titleRegex.exec(html)) !== null) {
          titles.push(tMatch[1]);
       }
       console.log("Titles:", titles);
    } else {
       console.log("Found:", sheets);
    }
  });
