// =====================
// 1) Equipos
// =====================

const equipos = [
  "Atlético Nacional",
  "Millonarios",
  "América de Cali",
  "Deportivo Cali",
  "Junior",
  "Independiente Medellín",
  "Santa Fe",
  "Once Caldas",
  "Deportes Tolima",
  "Atlético Bucaramanga",
  "La Equidad",
  "Jaguares",
  "Envigado",
  "Boyacá Chicó",
  "Alianza"
];

// =====================
// 2) Segmentos
// =====================

const segmentos = {
  "HJ": "Hincha joven",
  "HT": "Hincha tradicional",
  "AN": "Analista neutral",
  "AP": "Apuesta / rendimiento actual",
  "HI": "Hincha internacional"
};

// =====================
// 3) Contextos
// =====================

const contextos = {
  "H": "¿Cuál equipo es más GRANDE históricamente?",
  "A": "¿Cuál tiene mejor rendimiento ACTUAL?",
  "C": "¿Cuál tiene mejor CANTERA y proyección?",
  "F": "¿Cuál tiene mayor impacto en la AFICIÓN?"
};

const RATING_INICIAL = 1000;
const K = 32;
const STORAGE_KEY = "futbolmash_state";

// =====================
// Estado
// =====================

function defaultState(){
  const buckets = {};
  for (const seg in segmentos){
    for (const ctx in contextos){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      equipos.forEach(e => buckets[key][e] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =====================
// Elo
// =====================

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a];
  const rb = bucket[b];
  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  const sa = winner === "A" ? 1 : 0;
  const sb = winner === "B" ? 1 : 0;

  bucket[a] = ra + K * (sa - ea);
  bucket[b] = rb + K * (sb - eb);
}

function randomPair(){
  const a = equipos[Math.floor(Math.random() * equipos.length)];
  let b = a;
  while (b === a){
    b = equipos[Math.floor(Math.random() * equipos.length)];
  }
  return [a,b];
}

function bucketKey(seg, ctx){
  return `${seg}__${ctx}`;
}

function topN(bucket){
  return Object.entries(bucket)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10);
}

// =====================
// UI
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const questionEl = document.getElementById("question");
const topBox = document.getElementById("topBox");

function fillSelect(select,obj){
  for(const k in obj){
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = obj[k];
    select.appendChild(opt);
  }
}

fillSelect(segmentSelect,segmentos);
fillSelect(contextSelect,contextos);

let currentA, currentB;

function newDuel(){
  [currentA,currentB] = randomPair();
  labelA.textContent = currentA;
  labelB.textContent = currentB;
  questionEl.textContent = contextos[contextSelect.value];
}

function vote(winner){
  const key = bucketKey(segmentSelect.value,contextSelect.value);
  updateElo(state.buckets[key],currentA,currentB,winner);
  saveState();
  renderTop();
  newDuel();
}

function renderTop(){
  const key = bucketKey(segmentSelect.value,contextSelect.value);
  const top = topN(state.buckets[key]);

  topBox.innerHTML = top.map((e,i)=>`
    <div class="toprow">
      <div><b>${i+1}.</b> ${e[0]}</div>
      <div>${e[1].toFixed(1)}</div>
    </div>
  `).join("");
}

document.getElementById("btnA").onclick = ()=>vote("A");
document.getElementById("btnB").onclick = ()=>vote("B");
document.getElementById("btnNewPair").onclick = newDuel;
document.getElementById("btnShowTop").onclick = renderTop;

document.getElementById("btnReset").onclick = ()=>{
  state = defaultState();
  saveState();
  renderTop();
  newDuel();
};

newDuel();
renderTop();
