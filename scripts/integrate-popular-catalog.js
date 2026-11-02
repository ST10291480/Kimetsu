const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'app.js');
const htmlPath = path.join(root, 'index.html');
const stylePath = path.join(root, 'extras.css');
let app = fs.readFileSync(appPath, 'utf8');
let html = fs.readFileSync(htmlPath, 'utf8');

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Could not find ${label}`);
  return source.replace(before, after);
}

app = replaceOnce(app, 'const shows=[', 'const shows=[...window.popularAnimeCatalog,', 'catalog array');
app = replaceOnce(app, "view='home',filter='',query='',hot=[],current=null", "view='home',filter='',query='',catalogPage=0,hot=[],current=null", 'catalog paging state');
app = replaceOnce(app, "function all(){return [...shows,...hot.filter(h=>!shows.some(s=>s.aid===h.aid))]}", "function all(){return [...shows,...hot.filter(h=>!shows.some(s=>s.aid===h.aid||s.title.toLowerCase()===h.title.toLowerCase()))]}", 'catalog deduplication');
app = replaceOnce(app, "${filter||'Stories to begin with'}", "${query?'Search results':filter||'Popular anime'}", 'catalog heading');
app = replaceOnce(app, 'Anime details and community scores from AniDB.', '300 popular picks from AniList, ready to explore.', 'catalog subtitle');
app = replaceOnce(app, '${filtered.length?shelf(filtered):', '${filtered.length?shelf(filtered.slice(catalogPage*36,(catalogPage+1)*36)):', 'catalog page slice');
const pager = "${filtered.length>36?`<div class='catalog-pager'><button class='secondary-button' data-catalog-page='-1' ${catalogPage===0?'disabled':''}>Previous</button><span>Page ${catalogPage+1} of ${Math.ceil(filtered.length/36)} (${filtered.length} anime)</span><button class='secondary-button' data-catalog-page='1' ${catalogPage>=Math.ceil(filtered.length/36)-1?'disabled':''}>Next</button></div>`:''}";
app = replaceOnce(app, '<div class="feature-row">', `${pager}<div class="feature-row">`, 'catalog pager controls');
app = replaceOnce(app, "if(v){view=v.dataset.view;render();return}let f=", "if(v){view=v.dataset.view;render();return}let cp=e.target.closest('[data-catalog-page]');if(cp){catalogPage=Math.max(0,catalogPage+Number(cp.dataset.catalogPage));home();return}let f=", 'pagination click handler');
app = replaceOnce(app, "if(f){filter=f.dataset.filter;view='home';render();return}", "if(f){filter=f.dataset.filter;catalogPage=0;view='home';render();return}", 'filter pagination reset');
app = replaceOnce(app, "$('#search').addEventListener('input',e=>{query=e.target.value;", "$('#search').addEventListener('input',e=>{query=e.target.value;catalogPage=0;", 'search pagination reset');
app = replaceOnce(app, '<small>ANIDB SCORE</small>', "<small>${a.anilistId?'ANILIST SCORE':'ANIDB SCORE'}</small>", 'rating source label');

html = replaceOnce(html, '<script src="app.js"></script>', '<script src="popular-anime.js"></script>\n  <script src="app.js"></script>', 'catalog script tag');
fs.writeFileSync(appPath, app, 'utf8');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.appendFileSync(stylePath, '\n.catalog-pager{display:flex;justify-content:center;align-items:center;gap:16px;margin:0 0 30px;color:var(--muted);font-size:10px}.catalog-pager button:disabled{opacity:.4;cursor:default}\n', 'utf8');
console.log('Integrated the 300 anime catalog and added paginated discovery.');
