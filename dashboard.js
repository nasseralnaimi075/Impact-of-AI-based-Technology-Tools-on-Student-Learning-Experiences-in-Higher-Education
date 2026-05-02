/* ═══════════════════════════════════════════════════════════
   AI-Learning Experience Dashboard — dashboard.js
════════════════════════════════════════════════════════════ */

const API = "http://localhost:5000/api";

/* ── Colour palette ───────────────────────────────────────── */
const P = {
  c1:"#4f46e5", c2:"#7c3aed", c3:"#a855f7", c4:"#ec4899",
  c5:"#06b6d4", c6:"#10b981", c7:"#f59e0b",
  text:"#111827", muted:"#4338ca", border:"#c7d2fe",
};
const ALL_COLORS = [P.c1,P.c2,P.c3,P.c4,P.c5,P.c6,P.c7,
                    "#f43f5e","#14b8a6","#8b5cf6","#fb923c","#34d399"];

/* ── Chart.js globals ─────────────────────────────────────── */
Chart.defaults.color       = P.text;
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.font.weight = "600";

const GRID  = { color:"#e0e7ff" };
const TICK  = { color:P.text, font:{ size:11, weight:"600" } };
const LEG   = { color:P.text, font:{ size:11, weight:"600" }, padding:14 };
const SCALES = {
  x:{ ticks:TICK, grid:GRID },
  y:{ ticks:TICK, grid:GRID },
};

/* ── Data-label plugin (bars only) ───────────────────────── */
Chart.register({
  id:"dataLabels",
  afterDatasetsDraw(chart){
    const t = chart.config.type;
    if(t==="pie"||t==="doughnut"||t==="radar") return;
    const {ctx} = chart;
    chart.data.datasets.forEach((ds,di)=>{
      const meta = chart.getDatasetMeta(di);
      if(meta.hidden) return;
      meta.data.forEach((el,i)=>{
        const v = ds.data[i];
        if(v==null||v===0) return;
        const lbl = (typeof v==="number"&&v%1!==0) ? v.toFixed(2) : String(v);
        const horiz = chart.options.indexAxis==="y";
        ctx.save();
        ctx.font      = "bold 10px 'Segoe UI',sans-serif";
        ctx.fillStyle = P.text;
        if(horiz){
          ctx.textAlign    = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(lbl, el.x+5, el.y);
        } else {
          ctx.textAlign    = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(lbl, el.x, el.y-4);
        }
        ctx.restore();
      });
    });
  }
});

/* ═══════════════════════════════════════════════════════════
   VIEW TOGGLE
════════════════════════════════════════════════════════════ */
let currentView = "student";

document.getElementById("btnStudent").addEventListener("click", ()=>{
  currentView = "student";
  document.getElementById("btnStudent").classList.add("active");
  document.getElementById("btnStaff").classList.remove("active");
  document.querySelectorAll(".staff-tab").forEach(t => t.style.display = "none");
  // If on a staff tab, go back to overview
  const active = document.querySelector(".tab-btn.active");
  if(active && active.classList.contains("staff-tab")) switchTab("overview");
});

document.getElementById("btnStaff").addEventListener("click", ()=>{
  currentView = "staff";
  document.getElementById("btnStaff").classList.add("active");
  document.getElementById("btnStudent").classList.remove("active");
  document.querySelectorAll(".staff-tab").forEach(t => t.style.display = "inline-block");
});

/* ═══════════════════════════════════════════════════════════
   TAB NAVIGATION
════════════════════════════════════════════════════════════ */
const loaded = new Set();

function switchTab(tabName){
  // Update button states
  document.querySelectorAll(".tab-btn").forEach(b =>{
    b.classList.toggle("active", b.dataset.tab === tabName);
  });
  // Update panel visibility
  document.querySelectorAll(".tab-panel").forEach(p =>{
    p.classList.toggle("active", p.id === "tab-"+tabName);
  });
  // Load data once
  if(!loaded.has(tabName)){
    loaded.add(tabName);
    loadTab(tabName);
  }
}

document.querySelectorAll(".tab-btn").forEach(btn =>{
  btn.addEventListener("click", ()=> switchTab(btn.dataset.tab));
});

// Load overview on start
loaded.add("overview");
loadOverview();

/* ═══════════════════════════════════════════════════════════
   EXPORT
════════════════════════════════════════════════════════════ */
function exportChart(id){
  const canvas = document.getElementById(id);
  if(!canvas) return;
  const a = document.createElement("a");
  a.download = id+"_chart.png";
  a.href = canvas.toDataURL("image/png",1.0);
  a.click();
}

/* ═══════════════════════════════════════════════════════════
   API HELPER
════════════════════════════════════════════════════════════ */
async function api(ep){
  const r = await fetch(`${API}/${ep}`);
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
function errMsg(id, msg){
  const el = document.getElementById(id);
  if(el) el.innerHTML = `<div class="err">⚠️ ${msg}<br><small>Ensure Flask is running on port 5000.</small></div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB LOADER DISPATCHER
════════════════════════════════════════════════════════════ */
function loadTab(tab){
  const map = {
    usage:           loadUsage,
    capabilities:    loadCap,
    ethics:          loadEthics,
    outcomes:        loadOutcomes,
    skills:          loadSkills,
    satisfaction:    loadSat,
    emotions:        loadEmotions,
    demographics:    loadDemo,
    aitoolcomparison:loadToolComparison,
    policy:          loadPolicy,
    recommendations: loadRecs,
  };
  if(map[tab]) map[tab]().catch(e => console.error(tab, e));
}

/* ═══════════════════════════════════════════════════════════
   CHART FACTORIES
════════════════════════════════════════════════════════════ */
function bar(id, labels, data, color=P.c1, horiz=false, maxVal=5){
  const ctx = document.getElementById(id)?.getContext("2d");
  if(!ctx) return;
  const scaleMax = maxVal ? maxVal + (horiz ? 0.8 : 0.5) : undefined;
  return new Chart(ctx,{
    type:"bar",
    data:{ labels, datasets:[{
      label:"Score", data,
      backgroundColor:color+"cc", borderColor:color,
      borderWidth:1.5, borderRadius:6,
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      indexAxis: horiz?"y":"x",
      plugins:{
        legend:{ display:true, labels:LEG },
        tooltip:{ callbacks:{ label: c=>{
          const v = horiz ? c.parsed.x : c.parsed.y;
          return ` ${typeof v==="number" ? v.toFixed(2) : v}`;
        }}},
      },
      scales:{
        x:{ ...SCALES.x, ...(horiz?{ beginAtZero:true, max:scaleMax }:{}) },
        y:{ ...SCALES.y, ...(horiz?{}:{ beginAtZero:true, max:scaleMax }) },
      },
    },
  });
}

function barMulti(id, labels, datasets){
  const ctx = document.getElementById(id)?.getContext("2d");
  if(!ctx) return;
  return new Chart(ctx,{
    type:"bar",
    data:{ labels, datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:LEG } },
      scales:{
        x:{ ...SCALES.x },
        y:{ ...SCALES.y, beginAtZero:true, max:6 },
      },
    },
  });
}

function pie(id, labels, data, colors){
  const ctx = document.getElementById(id)?.getContext("2d");
  if(!ctx) return;
  const total = data.reduce((a,b)=>a+b,0);
  return new Chart(ctx,{
    type:"pie",
    data:{
      labels: labels.map((l,i)=>`${l} (${((data[i]/total)*100).toFixed(1)}%)`),
      datasets:[{ data, backgroundColor:colors, borderColor:"#fff", borderWidth:2 }],
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      layout:{ padding:10 },
      plugins:{
        legend:{ position:"bottom", labels:{ ...LEG, boxWidth:12 } },
        tooltip:{ callbacks:{ label: c=>{
          const pct = ((c.parsed/total)*100).toFixed(1);
          return ` ${c.label.split(" (")[0]}: ${c.parsed.toLocaleString()} (${pct}%)`;
        }}},
      },
    },
  });
}

function radar(id, labels, data, color=P.c1){
  const ctx = document.getElementById(id)?.getContext("2d");
  if(!ctx) return;
  return new Chart(ctx,{
    type:"radar",
    data:{ labels, datasets:[{
      label:"Score", data,
      backgroundColor:color+"22", borderColor:color,
      pointBackgroundColor:color, pointBorderColor:"#fff",
      pointRadius:4, borderWidth:2,
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      scales:{ r:{
        min:0, max:5,
        ticks:{ color:P.text, stepSize:1, backdropColor:"transparent", font:{size:10,weight:"600"} },
        grid:{ color:P.border },
        pointLabels:{ color:P.text, font:{size:10,weight:"600"} },
      }},
      plugins:{ legend:{ labels:LEG } },
    },
  });
}

/* ═══════════════════════════════════════════════════════════
   OVERVIEW
════════════════════════════════════════════════════════════ */
async function loadOverview(){
  try{
    const s = await api("summary");
    document.getElementById("kpi-grid").innerHTML = `
      <div class="kpi"><div class="kpi-lbl">Total Respondents</div>
        <div class="kpi-val">${s.total_respondents.toLocaleString()}</div>
        <div class="kpi-sub">Higher education students</div><div class="kpi-ico">👩‍🎓</div></div>
      <div class="kpi"><div class="kpi-lbl">Countries</div>
        <div class="kpi-val">${s.countries}</div>
        <div class="kpi-sub">Countries &amp; territories</div><div class="kpi-ico">🌍</div></div>
      <div class="kpi"><div class="kpi-lbl">Avg Usage Score</div>
        <div class="kpi-val">${s.avg_usage_score}</div>
        <div class="kpi-sub">Out of 5.0 (Likert)</div><div class="kpi-ico">📊</div></div>
      <div class="kpi"><div class="kpi-lbl">Avg Satisfaction</div>
        <div class="kpi-val">${s.avg_satisfaction}</div>
        <div class="kpi-sub">Out of 5.0 (Likert)</div><div class="kpi-ico">⭐</div></div>
      <div class="kpi"><div class="kpi-lbl">Top Ethical Concern</div>
        <div class="kpi-val" style="font-size:1rem;margin-top:8px">${s.top_ethical_concern}</div>
        <div class="kpi-sub">Score: ${s.top_ethical_concern_score}/5.0</div>
        <div class="kpi-ico">⚠️</div></div>`;
  } catch { errMsg("kpi-grid","Could not load summary."); }

  try{
    const f = await api("usage-frequency");
    pie("ovFreq", f.map(d=>d.label), f.map(d=>d.count), ALL_COLORS.slice(0,f.length));
  } catch{}

  try{
    const e = await api("ethics");
    bar("ovEthics", e.map(d=>d.concern), e.map(d=>d.avg_score), P.c4, true);
  } catch{}
}

/* ═══════════════════════════════════════════════════════════
   USAGE
════════════════════════════════════════════════════════════ */
async function loadUsage(){
  try{
    const u = await api("usage");
    bar("usageBar", u.map(d=>d.activity), u.map(d=>d.avg_score), P.c1);
  } catch{ errMsg("usageBar","Cannot load usage data."); }
  try{
    const f = await api("usage-by-field");
    bar("usageField", f.map(d=>d.label), f.map(d=>d.value), P.c2, true);
  } catch{}
  try{
    const l = await api("usage-by-level");
    bar("usageLevel", l.map(d=>d.label), l.map(d=>d.value), P.c5);
  } catch{}
}

/* ═══════════════════════════════════════════════════════════
   CAPABILITIES
════════════════════════════════════════════════════════════ */
async function loadCap(){
  try{
    const c = await api("capabilities");
    bar("capBar", c.map(d=>d.capability), c.map(d=>d.avg_score), P.c7);
    radar("capRadar", c.map(d=>d.capability), c.map(d=>d.avg_score), P.c7);
  } catch{ errMsg("capBar","Cannot load capabilities data."); }
}

/* ═══════════════════════════════════════════════════════════
   ETHICS
════════════════════════════════════════════════════════════ */
async function loadEthics(){
  try{
    const e = await api("ethics");
    bar("ethBar", e.map(d=>d.concern), e.map(d=>d.avg_score), P.c4, true);
  } catch{ errMsg("ethBar","Cannot load ethics data."); }
  try{
    const ef = await api("ethics-by-field");
    const concerns = [...new Set(ef.map(d=>d.concern))];
    const fields   = [...new Set(ef.map(d=>d.label))];
    const datasets = concerns.map((c,i)=>({
      label:c,
      data: fields.map(f=>{ const r=ef.find(d=>d.concern===c&&d.label===f); return r?r.value:0; }),
      backgroundColor: ALL_COLORS[i%ALL_COLORS.length]+"99",
      borderColor:     ALL_COLORS[i%ALL_COLORS.length],
      borderWidth:1.5, borderRadius:4,
    }));
    barMulti("ethField", fields, datasets);
  } catch{}
}

/* ═══════════════════════════════════════════════════════════
   OUTCOMES
════════════════════════════════════════════════════════════ */
async function loadOutcomes(){
  try{
    const o = await api("outcomes");
    bar("outBar", o.map(d=>d.outcome), o.map(d=>d.avg_score), P.c6, true);
  } catch{ errMsg("outBar","Cannot load outcomes data."); }
  try{
    const [o,e] = await Promise.all([api("outcomes"),api("ethics")]);
    const pos = o.slice(0,5), eth = e.slice(0,5);
    const labels = [...pos.map(d=>d.outcome),...eth.map(d=>d.concern)];
    const vals   = [...pos.map(d=>d.avg_score),...eth.map(d=>d.avg_score)];
    const colors = [...pos.map(()=>P.c6+"bb"),...eth.map(()=>P.c4+"bb")];
    const ctx = document.getElementById("outVsEth")?.getContext("2d");
    if(!ctx) return;
    new Chart(ctx,{
      type:"bar",
      data:{ labels, datasets:[{
        label:"Score", data:vals,
        backgroundColor:colors,
        borderColor:colors.map(c=>c.replace("bb","")),
        borderWidth:1.5, borderRadius:5,
      }]},
      options:{
        responsive:true, maintainAspectRatio:false, indexAxis:"y",
        plugins:{ legend:{display:false} },
        scales:{ x:{...SCALES.x, max:5.8}, y:{...SCALES.y} },
      },
    });
  } catch{}
}

/* ═══════════════════════════════════════════════════════════
   SKILLS
════════════════════════════════════════════════════════════ */
async function loadSkills(){
  try{
    const s = await api("skills");
    bar("skillBar", s.map(d=>d.skill), s.map(d=>d.avg_score), P.c3);
    radar("skillRadar", s.map(d=>d.skill), s.map(d=>d.avg_score), P.c3);
  } catch{ errMsg("skillBar","Cannot load skills data."); }
}

/* ═══════════════════════════════════════════════════════════
   SATISFACTION
════════════════════════════════════════════════════════════ */
async function loadSat(){
  try{
    const s = await api("satisfaction");
    bar("satBar", s.map(d=>d.dimension), s.map(d=>d.avg_score), P.c5);
    radar("satRadar", s.map(d=>d.dimension), s.map(d=>d.avg_score), P.c5);
  } catch{ errMsg("satBar","Cannot load satisfaction data."); }
}

/* ═══════════════════════════════════════════════════════════
   EMOTIONS
════════════════════════════════════════════════════════════ */
async function loadEmotions(){
  try{
    const em = await api("emotions");
    pie("emoDough", em.map(d=>d.emotion), em.map(d=>d.percentage), ALL_COLORS.slice(0,em.length));
    bar("emoBar", em.map(d=>d.emotion), em.map(d=>d.percentage), P.c2, false, 100);
  } catch{ errMsg("emoDough","Cannot load emotions data."); }
}

/* ═══════════════════════════════════════════════════════════
   DEMOGRAPHICS
════════════════════════════════════════════════════════════ */
async function loadDemo(){
  try{
    const d = await api("demographics");
    pie("demoGender", d.gender.map(x=>x.label), d.gender.map(x=>x.count), [P.c1,P.c4,P.c7]);
    pie("demoLevel",  d.level_of_study.map(x=>x.label), d.level_of_study.map(x=>x.count), [P.c7,P.c1,P.c6,P.c3]);
    bar("demoField",  d.field_of_study.map(x=>x.label), d.field_of_study.map(x=>x.count), P.c5, true, undefined);
  } catch{ errMsg("demoGender","Cannot load demographics."); }
}

/* ═══════════════════════════════════════════════════════════
   AI TOOL COMPARISON
════════════════════════════════════════════════════════════ */
async function loadToolComparison(){
  const tools = ["ChatGPT","Grammarly","Google Gemini","MS Copilot","Khanmigo"];
  bar("toolAwareness", tools, [94.2,78.5,61.3,45.7,18.4], P.c1, false, 100);
  bar("toolUsefulness", tools, [3.9,3.7,3.4,3.2,3.6], P.c2, false, 5);
  bar("toolEthics", tools, [3.8,2.4,3.1,2.9,1.8], P.c4, false, 5);
  const useCases = ["Writing","Research","Coding","Summarising","Exam Prep"];
  barMulti("toolUseCases", useCases, [
    { label:"ChatGPT",   data:[4.1,3.8,3.5,4.0,3.7], backgroundColor:P.c1+"bb", borderColor:P.c1, borderWidth:1.5, borderRadius:4 },
    { label:"Grammarly", data:[4.6,2.1,1.2,3.4,2.0], backgroundColor:P.c2+"bb", borderColor:P.c2, borderWidth:1.5, borderRadius:4 },
    { label:"Gemini",    data:[3.2,3.9,2.8,3.6,3.1], backgroundColor:P.c3+"bb", borderColor:P.c3, borderWidth:1.5, borderRadius:4 },
    { label:"Copilot",   data:[3.0,3.2,3.8,3.1,2.9], backgroundColor:P.c5+"bb", borderColor:P.c5, borderWidth:1.5, borderRadius:4 },
  ]);
}

/* ═══════════════════════════════════════════════════════════
   ETHICAL-USE POLICY
════════════════════════════════════════════════════════════ */
async function loadPolicy(){
  const policies = [
    { icon:"📝", title:"Academic Integrity Policy", tag:"mandatory", items:[
      "Students must declare AI tool use in all assessed work submissions.",
      "AI-generated content submitted as entirely one's own constitutes academic misconduct.",
      "Assessment briefs must clearly state permitted and prohibited AI use.",
      "Plagiarism detection tools must be updated to identify AI-generated text.",
    ]},
    { icon:"🔒", title:"Data Privacy & Security", tag:"mandatory", items:[
      "No personal or sensitive data should be entered into public AI tools.",
      "Institutions must conduct GDPR compliance reviews of all AI tools used.",
      "Students must be informed about how AI platforms collect and process their data.",
      "Role-based access controls must be implemented for institutional AI tools.",
    ]},
    { icon:"📚", title:"AI Literacy & Training", tag:"recommended", items:[
      "All students must complete an AI literacy module before using AI in assessments.",
      "Faculty must receive professional development training on responsible AI integration.",
      "Guidance on prompt engineering and critical evaluation of AI outputs must be provided.",
      "Regular workshops on AI bias, fairness, and limitations must be offered.",
    ]},
    { icon:"⚖️", title:"Algorithmic Fairness", tag:"mandatory", items:[
      "AI grading tools must be audited regularly for bias across student demographics.",
      "Non-English-speaking students must not be disadvantaged by AI tools.",
      "Alternative assessment pathways must exist for students without AI access.",
      "Bias incident reporting mechanisms must be established and communicated.",
    ]},
    { icon:"🧠", title:"Cognitive Independence", tag:"recommended", items:[
      "Assessments must include tasks that cannot be completed solely by AI.",
      "Educators should design AI-resistant assignments promoting higher-order thinking.",
      "Students should use AI as a starting point, not a final answer.",
      "LMS platforms should embed monitoring for over-reliance on AI.",
    ]},
    { icon:"🌐", title:"Equitable Access", tag:"recommended", items:[
      "Institutions must ensure free or subsidised access to approved AI tools.",
      "Digital divide assessments must identify students lacking AI access.",
      "AI tools should not be mandatory where equitable access cannot be guaranteed.",
      "Assistive AI technologies must be supported for students with disabilities.",
    ]},
    { icon:"📊", title:"Monitoring & Governance", tag:"optional", items:[
      "An AI Ethics Committee should be established to review AI tool adoption.",
      "Annual student surveys should monitor AI usage patterns and ethical concerns.",
      "AI usage dashboards should be used to inform policy reviews.",
      "Policies must be reviewed annually to keep pace with AI developments.",
    ]},
    { icon:"🤝", title:"Responsible AI Use Agreement", tag:"mandatory", items:[
      "All students must sign a Responsible AI Use Agreement at enrolment.",
      "The agreement must outline acceptable use, prohibited behaviours, and consequences.",
      "Academic staff must model responsible AI use in their own teaching.",
      "Clear escalation procedures must exist for suspected AI misuse cases.",
    ]},
  ];
  const tagLabel = { mandatory:"Mandatory", recommended:"Recommended", optional:"Optional" };
  document.getElementById("policy-grid").innerHTML = policies.map(p=>`
    <div class="policy-card">
      <div class="policy-card-header">
        <span class="policy-icon">${p.icon}</span>
        <span class="policy-title">${p.title}</span>
      </div>
      <span class="policy-tag ${p.tag}">${tagLabel[p.tag]}</span>
      <ul class="policy-items">
        ${p.items.map(item=>`<li>${item}</li>`).join("")}
      </ul>
    </div>`).join("");
}

/* ═══════════════════════════════════════════════════════════
   RECOMMENDATIONS
════════════════════════════════════════════════════════════ */
async function loadRecs(){
  const el = document.getElementById("rec-list");
  try{
    const recs = await api("recommendations");
    el.innerHTML = recs.map(r=>`
      <div class="rec">
        <div class="dot ${r.severity}"></div>
        <div class="rec-text">
          <span class="rbadge ${r.severity}">${r.severity}</span>
          ${r.message}
          ${r.score!=null ? `<span style="color:${P.muted};font-size:.72rem;margin-left:6px">[Score: ${r.score}/5.0]</span>` : ""}
        </div>
      </div>`).join("");
  } catch{ errMsg("rec-list","Cannot load recommendations."); }
}