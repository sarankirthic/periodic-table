/* ============================================================
   Periodic Table renderer + hover popup
   ============================================================ */
(function(){
  const ELS = window.ELEMENTS;

  const CAT_LABELS = {
    alkali:"Alkali metals", alkaline:"Alkaline earth metals",
    transition:"Transition metals", post:"Post-transition metals",
    metalloid:"Metalloids", nonmetal:"Nonmetals", halogen:"Halogens",
    noble:"Noble gases", lanthanide:"Lanthanides", actinide:"Actinides"
  };
  const CAT_ORDER = ["alkali","alkaline","transition","post","metalloid","nonmetal","halogen","noble","lanthanide","actinide"];

  /* ---------- build the inner markup of one element cell ---------- */
  function cellInner(e){
    return `
      <div class="upper"></div>
      <div class="znum">${e.z}</div>
      <div class="rcol">
        <div class="rf mass">${e.mass}</div>
        <div class="rf">${fmt(e.mp)}</div>
        <div class="rf">${fmt(e.bp)}</div>
        <div class="rf">${e.en?e.en:"&mdash;"}</div>
        <div class="rf">${e.den}</div>
      </div>
      <div class="sym">${e.sym}</div>
      <div class="midrow">
        <div class="ionic"><span>${e.ir}</span></div>
        <div class="ionis"><span>${e.ie?e.ie:"&mdash;"}</span></div>
      </div>
      <div class="ox">${e.ox}</div>
      <div class="cfg">${e.cfg}</div>
      <div class="nm">${e.name}</div>`;
  }
  function fmt(v){ return (v===""||v==null) ? "&mdash;" : v; }

  /* ---------- grid row for an element (f-block drops to 9/10) ---------- */
  function gridRow(e){ return e.y<=7 ? e.y : (e.y===8?9:10); }

  /* ---------- render all cells ---------- */
  const ptable = document.getElementById("ptable");
  ELS.forEach(e=>{
    const d = document.createElement("div");
    d.className = "cell cat-"+e.cat;
    d.style.gridColumn = e.x;
    d.style.gridRow = gridRow(e);
    d.innerHTML = cellInner(e);
    d.addEventListener("mouseenter", ev=>showPopup(e, d));
    d.addEventListener("mousemove", positionPopup);
    d.addEventListener("mouseleave", hidePopup);
    ptable.appendChild(d);
  });

  /* ---------- placeholders for La/Ac ranges in the main body ---------- */
  function placeholder(col,row,a,b,label){
    const p=document.createElement("div");
    p.className="placeholder";
    p.style.gridColumn=col; p.style.gridRow=row;
    p.innerHTML=`<b>${a}&ndash;${b}</b><span>${label}</span>`;
    ptable.appendChild(p);
  }
  placeholder(3,6,57,71,"Lanthanides");
  placeholder(3,7,89,103,"Actinides");

  /* ---------- series labels at the start of the f-block rows ---------- */
  function seriesLabel(row,txt){
    const s=document.createElement("div");
    s.style.gridColumn="1 / span 2"; s.style.gridRow=row;
    s.style.alignSelf="center"; s.style.color="#e9d9bd";
    s.style.fontSize="12px"; s.style.letterSpacing=".05em";
    s.style.textTransform="uppercase"; s.style.textAlign="center";
    s.style.lineHeight="1.3";
    s.innerHTML=txt;
    ptable.appendChild(s);
  }
  seriesLabel(9,"Lanthanide<br>series");
  seriesLabel(10,"Actinide<br>series");

  /* ---------- legend ---------- */
  const lk = document.getElementById("legendKey");
  CAT_ORDER.forEach(c=>{
    const el=document.createElement("div");
    el.className="lk cat-"+c;
    el.innerHTML=`<i></i>${CAT_LABELS[c]}`;
    lk.appendChild(el);
  });

  /* ---------- reference key cell (the annotated example) ---------- */
  const mn = ELS.find(e=>e.z===25);
  const kc = document.getElementById("keycellWrap");
  kc.innerHTML = `
    <div class="cell cat-${mn.cat} kc-cell">${cellInner(mn)}</div>
    <div class="kc-note">
      <h4>How to read a cell</h4>
      <ul>
        <li><b>Atomic number</b> pink badge, top-left</li>
        <li><b>Right column</b> mass &middot; melting &middot; boiling &middot; electronegativity &middot; density</li>
        <li><b>Teal box</b> crystal ionic radius (&Aring;)</li>
        <li><b>Yellow box</b> ionisation potential (eV)</li>
        <li><b>Purple bands</b> oxidation states &middot; electron config</li>
        <li><b>Green band</b> element name</li>
      </ul>
    </div>`;

  /* ============================================================
     POPUP
     ============================================================ */
  const popup = document.getElementById("popup");
  const popupCell = document.getElementById("popupCell");
  const popupDetail = document.getElementById("popupDetail");
  let cursor = {x:0,y:0};

  const imgCache = new Map();

  function fetchElementImage(e) {
    const slot = document.getElementById('pd-img-' + e.z);
    if (!slot) return;
    if (imgCache.has(e.z)) {
      const url = imgCache.get(e.z);
      if (url) renderImage(slot, url);
      return;
    }
    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(e.name))
      .then(r => r.json())
      .then(data => {
        const url = (data.thumbnail || data.originalimage || {}).source || null;
        imgCache.set(e.z, url);
        const current = document.getElementById('pd-img-' + e.z);
        if (url && current) renderImage(current, url);
      })
      .catch(() => imgCache.set(e.z, null));
  }

  function renderImage(slot, url) {
    const img = document.createElement('img');
    img.alt = '';
    img.onload = () => slot.classList.add('loaded');
    img.src = url;
    slot.appendChild(img);
  }

  function showPopup(e, srcEl){
    popupCell.className = "popup-cell cat-"+e.cat;
    popupCell.innerHTML = `<div class="cell cat-${e.cat}">${cellInner(e)}</div>`;
    popupDetail.className = "popup-detail cat-"+e.cat;
    popupDetail.innerHTML = detailHTML(e);
    popup.classList.add("show");
    popup.setAttribute("aria-hidden","false");
    positionPopup();
    fetchElementImage(e);
  }
  function hidePopup(){
    popup.classList.remove("show");
    popup.setAttribute("aria-hidden","true");
  }
  document.addEventListener("mousemove", ev=>{ cursor.x=ev.clientX; cursor.y=ev.clientY; });

  function positionPopup(){
    if(!popup.classList.contains("show")) return;
    const pad=16;
    const r = popup.getBoundingClientRect();
    let x = cursor.x + 22;
    let y = cursor.y + 22;
    if(x + r.width + pad > window.innerWidth)  x = cursor.x - r.width - 22;
    if(x < pad) x = pad;
    if(y + r.height + pad > window.innerHeight) y = window.innerHeight - r.height - pad;
    if(y < pad) y = pad;
    popup.style.left = x+"px";
    popup.style.top  = y+"px";
  }

  function stat(l,v){ return `<div class="pd-stat"><div class="l">${l}</div><div class="v">${v}</div></div>`; }
  function detailHTML(e){
    const groups = ["","1 (IA)","2 (IIA)","3 (IIIB)","4 (IVB)","5 (VB)","6 (VIB)","7 (VIIB)","8 (VIII)","9 (VIII)","10 (VIII)","11 (IB)","12 (IIB)","13 (IIIA)","14 (IVA)","15 (VA)","16 (VIA)","17 (VIIA)","18 (0)"];
    return `
      <div class="pd-cat">${CAT_LABELS[e.cat]}</div>
      <div class="pd-name">${e.name}</div>
      <div class="pd-sub">${e.sym} &middot; atomic number ${e.z} &middot; group ${groups[e.x]||"&mdash;"} &middot; period ${e.y<=7?e.y:(e.y===8?6:7)}</div>
      <div class="pd-img" id="pd-img-${e.z}"></div>
      <div class="pd-stats">
        ${stat("Atomic mass", e.mass)}
        ${stat("Electronegativity", e.en?e.en:"&mdash;")}
        ${stat("Melting pt (&deg;C)", fmt(e.mp))}
        ${stat("Boiling pt (&deg;C)", fmt(e.bp))}
        ${stat("Density", e.den)}
        ${stat("Ionisation (eV)", e.ie?e.ie:"&mdash;")}
        ${stat("Oxidation states", e.ox)}
        ${stat("Ionic radius (&Aring;)", e.ir)}
        ${stat("Electron configuration", e.cfg)}
      </div>
      <div class="pd-feat"><b>Features &amp; uses.</b> ${e.uses}</div>`;
  }

  /* ============================================================
     SCALE-TO-FIT
     ============================================================ */
  const scaler = document.getElementById("scaler");
  function fit(){
    scaler.style.transform = "scale(1)";
    const avail = window.innerWidth - 44;        // body horizontal padding
    const w = scaler.scrollWidth;
    const s = Math.min(1, avail / w);
    scaler.style.transform = "scale("+s+")";
    // collapse the empty space left by scaling
    scaler.style.marginBottom = (scaler.scrollHeight*(s-1))+"px";
  }
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);
  fit();
})();
