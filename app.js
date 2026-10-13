const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const DAY = 86400000;
const STORAGE_KEY = "focuspath-v1";
const todayISO = () => new Date().toLocaleDateString("en-CA");
const addDays = (date, n) => { const d = new Date(date+"T12:00:00"); d.setDate(d.getDate()+n); return d.toLocaleDateString("en-CA"); };
const prettyDate = d => new Date(d+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defaultTasks = [
 ["Revise Python fundamentals: functions, lists and dictionaries","Revision",60,"09:00","",0],
 ["Apna College: continue Pandas lesson","Apna College / Pandas",90,"10:00","Code along and write your own examples.",0],
 ["Independent Pandas practice: load, clean and group a CSV","Project",60,"11:45","Answer five questions without copying.",0],
 ["Revise SQL joins and aggregations","Revision",60,"14:00","Solve five queries from memory.",0],
 ["English: listen, read aloud and record a short explanation","English",30,"16:00","Explain what you learned today.",0],
 ["Job search: review vacancies and send tailored applications","Job search",30,"17:00","Track role, date and follow-up.",0]
];
function seedState(){
 const today=todayISO();
 const tasks=defaultTasks.map((t,i)=>({id:crypto.randomUUID(),title:t[0],category:t[1],duration:t[2],time:t[3],notes:t[4],date:today,repeat:i===0||i===4||i===5,done:false,doneDates:[],createdAt:Date.now()}));
 return {tasks,createdAt:today,streak:0,history:{},settings:{notifications:false,supabaseUrl:"",supabaseKey:"",email:"",password:""},activeView:"today"};
}
let state;
try { state=JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedState(); } catch { state=seedState(); }
let activeView="today", filter="All", toastTimer;
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function showToast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function daysSinceStart(){return Math.max(1,Math.min(90,Math.floor((new Date(todayISO()+"T12:00:00")-new Date((state.createdAt||todayISO())+"T12:00:00"))/DAY)+1));}
function tasksForDate(date=todayISO()){return state.tasks.filter(t=>t.date===date || (t.repeat && t.date<date));}
function isDoneFor(t,date=todayISO()){return t.repeat ? (t.doneDates||[]).includes(date) : !!t.done;}
function setDone(t,date,done){if(t.repeat){t.doneDates=t.doneDates||[];t.doneDates=t.doneDates.filter(d=>d!==date);if(done)t.doneDates.push(date);}else t.done=done;}
function getStreak(){let count=0,d=todayISO();while(count<366){const tasks=tasksForDate(d);if(!tasks.length||!tasks.every(t=>isDoneFor(t,d)))break;count++;d=addDays(d,-1);}return count;}
function escAttr(s){return escapeHTML(s).replace(/`/g,"&#96;");}
function categoryClass(c){if(c==="English")return "green";if(c==="Job search")return "orange";return "";}
function taskCard(t,date=todayISO()){
 const done=isDoneFor(t,date);
 return `<article class="task-card ${done?"done":""}">
  <input class="task-check" type="checkbox" aria-label="Complete ${escAttr(t.title)}" data-action="toggle" data-id="${t.id}" data-date="${date}" ${done?"checked":""}>
  <div class="task-body"><span class="task-title">${escapeHTML(t.title)}</span><div class="task-meta"><span class="tag ${categoryClass(t.category)}">${escapeHTML(t.category)}</span><span>◷ ${t.time||"No reminder"}</span><span>${t.duration||0} min</span>${t.repeat?'<span>↻ Daily</span>':""}</div>${t.notes?`<div class="subtext">${escapeHTML(t.notes)}</div>`:""}</div>
  <div class="task-actions"><button class="mini-btn" data-action="edit" data-id="${t.id}" title="Edit">✎</button><button class="mini-btn" data-action="delete" data-id="${t.id}" title="Delete">×</button></div>
 </article>`;
}
function statCard(label,value,sub,icon){return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;}
function renderToday(){
 const list=tasksForDate().sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));
 const done=list.filter(t=>isDoneFor(t)).length, total=list.length, pct=total?Math.round(done/total*100):0;
 const mins=list.filter(t=>isDoneFor(t)).reduce((s,t)=>s+(+t.duration||0),0);
 const due=list.filter(t=>!isDoneFor(t)).length;
 const next=list.find(t=>!isDoneFor(t)&&t.time);
 return `<section class="hero"><div><div class="hero-kicker">YOUR NEXT 90 DAYS</div><h2>Small steps. Serious progress.</h2><p>Build job-ready data skills, explore GenAI, practise English and keep moving toward your first role.</p></div><div class="hero-stat"><strong>${daysSinceStart()}<small style="font-size:14px">/90</small></strong><span>day of your plan</span></div></section>
 <div class="stats-grid">${statCard("TASKS DONE",`${done}/${total}`,"Today's checklist","✓")}${statCard("FOCUS TIME",`${(mins/60).toFixed(mins%60?1:0)}h`,`${mins} minutes completed`,"◷")}${statCard("TO DO",due,"Tasks remaining today","↗")}${statCard("STREAK",`${getStreak()} day`,"Completed full days","🔥")}</div>
 <div class="content-grid"><div class="left-col"><section class="panel"><div class="panel-head"><div><h3>Today's focus</h3><div class="subtext">${prettyDate(todayISO())} · Your daily checklist</div></div><button class="btn primary" data-action="add">＋ Add task</button></div><div class="task-list">${list.length?list.map(t=>taskCard(t)).join(""):'<div class="empty"><strong>Nothing scheduled yet</strong>Add a task and make today count.</div>'}</div></section>
 <section class="panel"><div class="panel-head"><div><h3>Next up</h3><div class="subtext">Keep the next step visible</div></div><button class="text-btn" data-action="view" data-view="reminders">Manage reminders →</button></div>${next?`<div class="task-card"><div class="stat-icon">◷</div><div class="task-body"><span class="task-title">${escapeHTML(next.title)}</span><div class="task-meta"><span>${next.time}</span><span>${next.duration} min</span></div></div></div>`:'<div class="empty">You have completed everything scheduled today. Nice work.</div>'}</section></div>
 <div class="right-col"><section class="panel"><div class="panel-head"><div><h3>Daily completion</h3><div class="subtext">Progress for today</div></div></div><div class="progress-ring" style="--progress:${pct*3.6}deg"><div><strong>${pct}%</strong><small>completed</small></div></div><div class="progress-legend"><div class="legend-row"><span class="legend-name"><i class="dot"></i> Completed</span><b>${done}</b></div><div class="legend-row"><span class="legend-name"><i class="dot" style="background:#e7e9f2"></i> Remaining</span><b>${total-done}</b></div></div></section>
 <section class="panel"><div class="panel-head"><div><h3>Weekly rhythm</h3><div class="subtext">Tasks completed per day</div></div></div>${weekChart()}</section></div></div>`;
}
function weekChart(){
 const days=[];for(let i=6;i>=0;i--){const d=addDays(todayISO(),-i),ts=tasksForDate(d),n=ts.filter(t=>isDoneFor(t,d)).length;days.push({d,n,label:new Date(d+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"}),today:d===todayISO()});}
 const max=Math.max(1,...days.map(x=>x.n));
 return `<div class="week-bars">${days.map(x=>`<div class="week-day"><div class="week-bar ${x.today?"today":""}" style="height:${Math.max(3,x.n/max*78)}px" title="${x.n} tasks"></div><small>${x.label}</small></div>`).join("")}</div>`;
}
const roadmap=[
 {title:"Foundation & Pandas",days:"Days 1–14",category:"Apna College / Pandas",desc:"Revise Python and NumPy; finish core Pandas workflows.",items:["Filtering, missing values and groupby","Merge, aggregation and dates","One independent CSV analysis"]},
 {title:"Analytics & job readiness",days:"Days 15–30",category:"Project",desc:"Turn data skills into proof employers can inspect.",items:["SQL joins, CTEs and window functions","Excel and Power BI practice","Publish a sales analytics project"]},
 {title:"LangChain & GenAI",days:"Days 21–49",category:"LangChain / GenAI",desc:"Complete the 24-hour course with hands-on practice.",items:["LLM API calls and structured outputs","Embeddings, retrieval and RAG","Build a document Q&A prototype"]},
 {title:"Classical machine learning",days:"Days 35–60",category:"Revision",desc:"Build a sound ML foundation alongside the GenAI course.",items:["Train/test split and preprocessing","Regression and classification","Metrics, overfitting and leakage"]},
 {title:"LangGraph & agentic AI",days:"Days 49–77",category:"LangGraph / Agentic AI",desc:"Complete the 30-hour course and build controlled workflows.",items:["State, nodes, edges and routing","Tool calls and checkpoints","Evaluation and human approval"]},
 {title:"Portfolio & job search",days:"Days 1–90",category:"Job search",desc:"Apply early and keep improving the evidence of your skills.",items:["Tailored applications every week","Mock interviews and project walkthroughs","Track responses and follow-ups"]},
 {title:"English practice",days:"Days 1–90",category:"English",desc:"Improve clarity and confidence through daily repetition.",items:["Listen and read aloud","Record a short technical explanation","Practise interview answers"]}
];
function renderRoadmap(){
 return `<div class="hero"><div><div class="hero-kicker">THE PLAN</div><h2>Your 90-day roadmap</h2><p>Use the course as your structure. Use projects, revision and applications to turn learning into job readiness.</p></div><div class="hero-stat"><strong>${daysSinceStart()}</strong><span>day of 90</span></div></div><h2 class="section-title">Learning phases</h2><div class="roadmap-grid">${roadmap.map((r,i)=>`<article class="road-card"><div class="road-top"><span class="tag ${i===5?"orange":i===6?"green":""}">${r.category}</span><span class="road-date">${r.days}</span></div><h3>${r.title}</h3><p>${r.desc}</p><ul class="road-list">${r.items.map(x=>`<li>${x}</li>`).join("")}</ul><div class="btn-row"><button class="btn secondary" data-action="add-roadmap" data-title="${escAttr(r.title)}" data-category="${escAttr(r.category)}">＋ Add task</button></div></article>`).join("")}</div>`;
}
function renderReminders(){
 const upcoming=tasksForDate().filter(t=>t.time).sort((a,b)=>a.time.localeCompare(b.time));
 return `<section class="hero"><div><div class="hero-kicker">STAY ON TRACK</div><h2>Your reminders</h2><p>Set reminder times on tasks and enable browser notifications. Recurring tasks appear each day.</p></div><div class="hero-stat"><strong>${upcoming.length}</strong><span>timed tasks today</span></div></section>
 <section class="panel" style="margin-top:18px"><div class="panel-head"><div><h3>Today's reminder schedule</h3><div class="subtext">Times use this device's local timezone</div></div><button class="btn primary" data-action="add">＋ Add reminder</button></div>
 ${upcoming.length?upcoming.map(t=>`<div class="reminder-row"><div class="reminder-time">${escapeHTML(t.time)}</div><div class="reminder-info"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.category)} · ${t.repeat?"Repeats daily":"One-time"} · ${t.duration} min</small></div><button class="mini-btn" data-action="edit" data-id="${t.id}">Edit</button></div>`).join(""):'<div class="empty"><strong>No timed reminders yet</strong>Edit a task and add a reminder time.</div>'}
 <div class="callout">Notification reality check: browser reminders are checked while this app is open (or its tab is running). Reliable reminders when the app/browser is fully closed require a push-notification server or a native Android app. See Settings & sync for setup details.</div>
 </section><section class="panel"><h3>Enable notifications</h3><p class="subtext">Allow this browser to show notifications while FocusPath is running.</p><div class="btn-row"><button class="btn primary" data-action="enable-notifications">Enable browser notifications</button><button class="btn secondary" data-action="test-notification">Send test</button></div><div class="subtext" style="margin-top:12px" id="notification-status"></div></section>`;
}
function renderProgress(){
 const all=tasksForDate(),done=all.filter(t=>isDoneFor(t)).length,pct=all.length?Math.round(done/all.length*100):0;
 const totalTasks=state.tasks.length, completedOneOff=state.tasks.filter(t=>t.done).length, completedRepeats=state.tasks.reduce((s,t)=>s+(t.doneDates||[]).length,0);
 const cats=[...new Set(state.tasks.map(t=>t.category))].map(c=>({c,n:state.tasks.filter(t=>t.category===c).length,d:state.tasks.filter(t=>t.category===c).reduce((s,t)=>s+(t.repeat?(t.doneDates||[]).length:(t.done?1:0)),0)}));
 return `<section class="hero"><div><div class="hero-kicker">PROGRESS YOU CAN SEE</div><h2>You're building momentum.</h2><p>Track consistency, not perfection. Every completed session is evidence of progress.</p></div><div class="hero-stat"><strong>${pct}%</strong><span>today completed</span></div></section>
 <div class="stats-grid">${statCard("TASKS CREATED",totalTasks,"Across your plan","▤")}${statCard("ONE-OFF DONE",completedOneOff,"Tasks completed","✓")}${statCard("RECURRING SESSIONS",completedRepeats,"Completed occurrences","↻")}${statCard("CURRENT STREAK",`${getStreak()} days`,"Full days completed","🔥")}</div>
 <div class="content-grid"><section class="panel"><div class="panel-head"><div><h3>Progress by category</h3><div class="subtext">Completion counts by study area</div></div></div>${cats.map(x=>`<div style="margin:17px 0"><div class="legend-row"><span>${escapeHTML(x.c)}</span><b>${x.d} completed</b></div><div class="bar"><span style="width:${Math.min(100,x.n?x.d/x.n*100:0)}%"></span></div></div>`).join("")||'<div class="empty">Add tasks to start tracking.</div>'}</section>
 <section class="panel"><h3>Weekly activity</h3><div class="subtext">Daily task completions</div>${weekChart()}<div class="callout good-callout">Tip: review your progress every Sunday and adjust next week's targets based on what actually worked.</div></section></div>`;
}
function renderSettings(){
 const s=state.settings||{};
 return `<section class="hero"><div><div class="hero-kicker">YOUR DATA, YOUR CHOICE</div><h2>Settings & sync</h2><p>Your checklist is saved locally on this device. Configure Supabase to sync it between your Android phone and laptop.</p></div></section>
 <div class="settings-grid" style="margin-top:18px">
 <section class="settings-card"><h3>🔔 Browser notifications</h3><p>Enable notifications for reminders while FocusPath is open. Notifications require HTTPS (or localhost) and browser permission.</p><div class="btn-row"><button class="btn primary" data-action="enable-notifications">Enable notifications</button><button class="btn secondary" data-action="test-notification">Test notification</button></div><div class="subtext" style="margin-top:10px" id="notification-status"></div></section>
 <section class="settings-card"><h3>☁️ Cross-device sync</h3><p>Optional Supabase sync. Create a project, enable Email authentication and create the table using the included <code>supabase.sql</code> file.</p>
 <label>Supabase project URL<input class="field" id="sb-url" placeholder="https://your-project.supabase.co" value="${escapeHTML(s.supabaseUrl||"")}"></label>
 <label>Supabase anon/public key<input class="field" id="sb-key" placeholder="Public anon key" value="${escapeHTML(s.supabaseKey||"")}"></label>
 <label>Email<input class="field" type="email" id="sb-email" placeholder="you@example.com" value="${escapeHTML(s.email||"")}"></label>
 <label>Password<input class="field" type="password" id="sb-password" placeholder="Account password"></label>
 <div class="btn-row"><button class="btn primary" data-action="sync-signup">Create account</button><button class="btn secondary" data-action="sync-login">Sign in & sync</button><button class="btn secondary" data-action="sync-now">Sync now</button></div>
 <div class="callout">Only use your own Supabase project. Never share your password or service-role key. This app uses the public anon key and per-user row security.</div></section>
 <section class="settings-card"><h3>📦 Backup and restore</h3><p>Download a backup of your tasks and settings, or restore a previous backup on another device.</p><div class="btn-row"><button class="btn primary" data-action="export">Export backup</button><button class="btn secondary" data-action="import">Import backup</button><input type="file" id="import-file" accept="application/json" hidden></div></section>
 <section class="settings-card"><h3>🔐 Privacy & reliability</h3><p>Local mode stores your data in this browser. Clearing browser data can remove it, so export backups. Cloud sync is optional and requires your own Supabase setup.</p><div class="callout">Recurring notifications are not guaranteed after the browser is fully closed. For reliable push while closed, deploy a push backend or wrap the app as a native Android app.</div></section></div>`;
}
function render(){
 const views={today:renderToday,roadmap:renderRoadmap,reminders:renderReminders,progress:renderProgress,settings:renderSettings};
 const titles={today:"Good day. Let's focus.",roadmap:"Your roadmap",reminders:"Reminders that keep you moving",progress:"Your progress",settings:"Make FocusPath yours"};
 $("#page-title").textContent=titles[activeView]||titles.today;
 $("#date-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
 $("#streak").textContent=getStreak();
 $("#view-container").innerHTML=(views[activeView]||renderToday)();
 $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===activeView));
 updateNotificationStatus();
}
function openTask(task=null){
 $("#task-form").reset();$("#task-id").value=task?.id||"";
 $("#dialog-title").textContent=task?"Edit task":"Add a task";
 $("#task-title").value=task?.title||"";$("#task-category").value=task?.category||"Revision";
 $("#task-date").value=task?.date||todayISO();$("#task-duration").value=task?.duration||60;
 $("#task-time").value=task?.time||"";$("#task-repeat").checked=!!task?.repeat;$("#task-notes").value=task?.notes||"";
 $("#task-dialog").showModal();setTimeout(()=>$("#task-title").focus(),50);
}
$("#task-form").addEventListener("submit",e=>{
 e.preventDefault();
 const id=$("#task-id").value;
 const task={id:id||crypto.randomUUID(),title:$("#task-title").value.trim(),category:$("#task-category").value,date:$("#task-date").value,duration:+$("#task-duration").value||60,time:$("#task-time").value,repeat:$("#task-repeat").checked,notes:$("#task-notes").value.trim(),done:false,doneDates:[],createdAt:Date.now()};
 if(!task.title)return;
 if(id){const old=state.tasks.find(t=>t.id===id);if(old){task.done=old.done;task.doneDates=old.doneDates||[];task.createdAt=old.createdAt;state.tasks=state.tasks.map(t=>t.id===id?task:t);}}
 else state.tasks.push(task);
 save();$("#task-dialog").close();render();showToast(id?"Task updated":"Task added");
});
$("#close-dialog").onclick=$("#cancel-dialog").onclick=()=>$("#task-dialog").close();
function enableNotifications(){
 if(!("Notification" in window)){showToast("This browser does not support notifications.");return;}
 Notification.requestPermission().then(p=>{state.settings.notifications=p==="granted";save();render();showToast(p==="granted"?"Notifications enabled":"Notification permission was not granted.");});
}
function updateNotificationStatus(){
 const el=$("#notification-status");if(!el)return;
 if(!("Notification" in window))el.textContent="Notifications are not supported by this browser.";
 else el.textContent=`Permission: ${Notification.permission}. ${state.settings.notifications?"Reminder checks enabled while app is running.":"Enable permission to receive browser notifications."}`;
}
function sendNotification(title,body){
 if(!("Notification" in window)||Notification.permission!=="granted")return;
 try{if("serviceWorker" in navigator && navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,icon:"",tag:"focuspath-"+title}));}else new Notification(title,{body});}catch(e){console.warn(e);}
}
const notified=new Set();
function checkReminders(){
 if(!state.settings?.notifications||!("Notification" in window)||Notification.permission!=="granted")return;
 const now=new Date(),date=todayISO(),hm=now.toTimeString().slice(0,5);
 for(const t of tasksForDate(date)){
  const key=`${date}|${t.id}|${hm}`;
  if(t.time===hm&&!isDoneFor(t,date)&&!notified.has(key)){notified.add(key);sendNotification("FocusPath reminder",t.title);}
 }
}
async function supabaseRequest(path,method="GET",body=null,token=null){
 const s=state.settings||{};if(!s.supabaseUrl||!s.supabaseKey)throw new Error("Enter your Supabase URL and public anon key in Settings first.");
 const headers={"apikey":s.supabaseKey,"Authorization":"Bearer "+(token||s.accessToken||s.supabaseKey),"Content-Type":"application/json"};
 if(method==="POST"||method==="PATCH")headers["Prefer"]="resolution=merge-duplicates,return=representation";
 const r=await fetch(s.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+path,{method,headers,body:body?JSON.stringify(body):undefined});
 const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||data?.msg||`Supabase error ${r.status}`);return data;
}
async function authRequest(action){
 const s=state.settings||{};
 s.email=$("#sb-email")?.value.trim()||s.email;
 s.supabaseUrl=$("#sb-url")?.value.trim()||s.supabaseUrl;
 s.supabaseKey=$("#sb-key")?.value.trim()||s.supabaseKey;
 const email=s.email,password=$("#sb-password")?.value||"";
 if(!s.supabaseUrl||!s.supabaseKey)throw new Error("Add Supabase project URL and anon key first.");
 if(!email||!password)throw new Error("Enter email and password in Settings.");
 state.settings=s;save();
 const endpoint=action==="signup"?"signup":"token?grant_type=password";
 const r=await fetch(s.supabaseUrl.replace(/\/$/,"")+"/auth/v1/"+endpoint,{method:"POST",headers:{"apikey":s.supabaseKey,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
 const d=await r.json();if(!r.ok)throw new Error(d.msg||d.message||d.error_description||"Authentication failed.");
 if(d.access_token){s.accessToken=d.access_token;s.userId=d.user.id;}else if(action==="signup"){showToast("Account created. Confirm your email if Supabase requires it, then sign in.");return;}
 state.settings=s;save();await syncNow();showToast("Signed in and synced.");
}
async function syncNow(){
 const s=state.settings||{};if(!s.accessToken||!s.userId)throw new Error("Sign in first.");
 const rows=state.tasks.map(t=>({user_id:s.userId,task_id:t.id,task_data:t,updated_at:new Date().toISOString()}));
 // Upsert current task snapshot by user_id + task_id.
 await supabaseRequest("study_tasks?on_conflict=user_id,task_id","POST",rows,s.accessToken);
 const cloud=await supabaseRequest("study_tasks?select=task_data&user_id=eq."+encodeURIComponent(s.userId), "GET",null,s.accessToken);
 if(Array.isArray(cloud)){const map=new Map(state.tasks.map(t=>[t.id,t]));cloud.forEach(row=>{if(row.task_data?.id)map.set(row.task_data.id,row.task_data)});state.tasks=[...map.values()];save();render();}
 showToast("Sync complete.");
}
function exportBackup(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="focuspath-backup-"+todayISO()+".json";a.click();URL.revokeObjectURL(url);showToast("Backup exported.");
}
document.addEventListener("click",async e=>{
 const nav=e.target.closest("[data-view]");if(nav){activeView=nav.dataset.view;render();return;}
 const b=e.target.closest("[data-action]");if(!b)return;
 const action=b.dataset.action,id=b.dataset.id;
 try{
  if(action==="add")openTask();
  if(action==="edit"){const t=state.tasks.find(t=>t.id===id);if(t)openTask(t);}
  if(action==="delete"){const t=state.tasks.find(t=>t.id===id);if(t&&confirm(`Delete "${t.title}"?`)){state.tasks=state.tasks.filter(t=>t.id!==id);save();render();showToast("Task deleted.");}}
  if(action==="toggle"){const t=state.tasks.find(t=>t.id===id);if(t){setDone(t,b.dataset.date,b.checked);state.history[b.dataset.date]=true;save();render();}}
  if(action==="add-roadmap"){openTask({title:b.dataset.title,category:b.dataset.category,date:todayISO(),duration:60,repeat:false,notes:"Roadmap milestone: define a clear done condition."});}
  if(action==="enable-notifications")enableNotifications();
  if(action==="test-notification"){if("Notification" in window && Notification.permission==="granted")sendNotification("FocusPath test","Notifications are working while this app is active.");else enableNotifications();}
  if(action==="export")exportBackup();
  if(action==="import")$("#import-file").click();
  if(action==="sync-signup"){await authRequest("signup");}
  if(action==="sync-login"){await authRequest("login");}
  if(action==="sync-now"){state.settings.supabaseUrl=$("#sb-url").value.trim();state.settings.supabaseKey=$("#sb-key").value.trim();save();await syncNow();}
 }catch(err){showToast(err.message||"Something went wrong.");}
});
$("#quick-add").addEventListener("click",()=>openTask());
$("#import-file").addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const imported=JSON.parse(await file.text());if(!Array.isArray(imported.tasks))throw new Error("Backup file does not contain tasks.");if(confirm("Replace this device's current tasks with the backup?")){state=imported;save();render();showToast("Backup restored.");}}catch(err){showToast("Import failed: "+err.message);}e.target.value="";
});
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost"))navigator.serviceWorker.register("./sw.js").catch(console.warn);
if(!state.createdAt)state.createdAt=todayISO();
if(!state.settings)state.settings={notifications:false,supabaseUrl:"",supabaseKey:"",email:"",password:""};
save();render();setInterval(checkReminders,15000);
window.addEventListener("focus",()=>{render();checkReminders();});
