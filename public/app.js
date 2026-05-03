/* ═══ Team Task Manager — Frontend SPA ═══ */
const API='/api';
const S={user:JSON.parse(localStorage.getItem('ttm_user')||'null'),token:localStorage.getItem('ttm_token'),cp:null,tasks:[]};
const api=axios.create({baseURL:API,headers:{'Content-Type':'application/json'}});
api.interceptors.request.use(c=>{if(S.token)c.headers.Authorization=`Bearer ${S.token}`;return c});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401)logout();return Promise.reject(e)});

function nav(p){history.pushState({},'',p);route()}
function route(){
  const p=location.pathname;
  if(!S.token&&p!=='/login'&&p!=='/register')return nav('/login');
  if(S.token&&(p==='/login'||p==='/register'))return nav('/dashboard');
  if(p==='/login')pgLogin();else if(p==='/register')pgRegister();
  else if(p==='/dashboard')pgDash();else if(p==='/projects')pgProjects();
  else if(p.match(/^\/projects\/\d+$/))pgProjectDetail({id:p.split('/')[2]});
  else if(p==='/users')pgUsers();else nav(S.token?'/dashboard':'/login');
}
window.onpopstate=route;

function toast(m,t='info'){const c=document.getElementById('toast-container'),d=document.createElement('div');d.className=`toast toast-${t}`;d.textContent=m;c.appendChild(d);setTimeout(()=>{d.classList.add('toast-exit');setTimeout(()=>d.remove(),250)},3500)}

async function doLogin(e,p){try{const r=await api.post('/auth/login',{email:e,password:p});S.token=r.data.data.token;S.user=r.data.data.user;localStorage.setItem('ttm_token',S.token);localStorage.setItem('ttm_user',JSON.stringify(S.user));toast('Welcome back!','success');nav('/dashboard')}catch(e){toast(e.response?.data?.message||'Login failed','error')}}
async function doReg(d){try{const r=await api.post('/auth/register',d);S.token=r.data.data.token;S.user=r.data.data.user;localStorage.setItem('ttm_token',S.token);localStorage.setItem('ttm_user',JSON.stringify(S.user));toast('Account created!','success');nav('/dashboard')}catch(e){const errs=e.response?.data?.errors;if(errs)errs.forEach(x=>toast(x.message,'error'));else toast(e.response?.data?.message||'Registration failed','error')}}
function logout(){S.token=null;S.user=null;localStorage.removeItem('ttm_token');localStorage.removeItem('ttm_user');nav('/login')}

function av(n){return`<div class="avatar">${(n||'?').split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)}</div>`}
function toggleSb(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sbo').classList.toggle('active')}

function sb(){
  const a=S.user?.role==='admin',p=location.pathname;
  return`<aside class="sidebar" id="sidebar">
    <div class="sidebar-header"><div class="sidebar-logo"><div class="logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>TaskFlow</div></div>
    <nav class="sidebar-nav">
      <div class="nav-item ${p==='/dashboard'?'active':''}" onclick="nav('/dashboard')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>Dashboard</div>
      <div class="nav-item ${p.startsWith('/projects')?'active':''}" onclick="nav('/projects')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Projects</div>
      ${a?`<div class="nav-item ${p==='/users'?'active':''}" onclick="nav('/users')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Team</div>`:''}</nav>
    <div class="sidebar-footer"><div class="user-card">${av(S.user?.name)}<div class="user-info"><div class="user-name">${S.user?.name||''}</div><div class="user-role">${S.user?.role||''}</div></div><button class="logout-btn" onclick="logout()" title="Sign out"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></button></div></div></aside>
    <div class="sidebar-overlay" id="sbo" onclick="toggleSb()"></div>
    <button class="mobile-toggle" onclick="toggleSb()"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>`}

function wrap(c){return`<div class="app-layout">${sb()}<main class="main-content">${c}</main></div>`}

/* ── Auth Pages ─────────────────────────────────────────── */
function pgLogin(){
  document.getElementById('app').innerHTML=`<div class="auth-wrapper"><div class="auth-card">
    <div class="brand"><div class="logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div><h1>TaskFlow</h1><p>Team Task Management Platform</p></div>
    <h2>Welcome back</h2><p class="subtitle">Sign in to your account</p>
    <form id="lf"><div class="form-group"><label>Email</label><input type="email" class="form-control" id="le" required placeholder="you@company.com"></div>
    <div class="form-group"><label>Password</label><input type="password" class="form-control" id="lp" required placeholder="••••••••"></div>
    <button class="btn btn-primary btn-block" type="submit">Sign In</button></form>
    <div class="auth-switch">Don't have an account? <a href="#" onclick="nav('/register')">Create one</a></div>
  </div></div>`;
  document.getElementById('lf').onsubmit=e=>{e.preventDefault();doLogin(document.getElementById('le').value,document.getElementById('lp').value)}
}

function pgRegister(){
  document.getElementById('app').innerHTML=`<div class="auth-wrapper"><div class="auth-card">
    <div class="brand"><div class="logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div><h1>TaskFlow</h1><p>Team Task Management Platform</p></div>
    <h2>Create account</h2><p class="subtitle">Start managing your team's work</p>
    <form id="rf"><div class="form-group"><label>Full Name</label><input type="text" class="form-control" id="rn" required></div>
    <div class="form-group"><label>Email</label><input type="email" class="form-control" id="re" required></div>
    <div class="form-group"><label>Password</label><input type="password" class="form-control" id="rp" required placeholder="Min 8 chars, letter + number"></div>
    <div class="form-group"><label>Role</label><select class="form-control" id="rr"><option value="member">Member</option><option value="admin">Admin</option></select></div>
    <button class="btn btn-primary btn-block" type="submit">Create Account</button></form>
    <div class="auth-switch">Already have an account? <a href="#" onclick="nav('/login')">Sign in</a></div>
  </div></div>`;
  document.getElementById('rf').onsubmit=e=>{e.preventDefault();doReg({name:document.getElementById('rn').value,email:document.getElementById('re').value,password:document.getElementById('rp').value,role:document.getElementById('rr').value})}
}

/* ── Dashboard ──────────────────────────────────────────── */
async function pgDash(){
  document.getElementById('app').innerHTML=wrap(`<div class="page-header"><h1>Dashboard</h1></div><div id="dc"><div class="stats-grid"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div></div>`);
  try{
    const r=await api.get('/dashboard'),d=r.data.data;
    const t=Number(d.tasksByStatus.todo||0),ip=Number(d.tasksByStatus.in_progress||0),dn=Number(d.tasksByStatus.done||0),tot=t+ip+dn;
    const pct=tot?Math.round(dn/tot*100):0;
    const bg=tot>0?`conic-gradient(#8b949e 0% ${t/tot*100}%,#06b6d4 ${t/tot*100}% ${(t+ip)/tot*100}%,#10b981 ${(t+ip)/tot*100}% 100%)`:'conic-gradient(#21262d 0% 100%)';
    document.getElementById('dc').innerHTML=`
      <div class="stats-grid">
        <div class="stat-card emerald"><div class="stat-value">${d.totalProjects}</div><div class="stat-label">Projects</div></div>
        <div class="stat-card cyan"><div class="stat-value">${d.totalTasks}</div><div class="stat-label">Total Tasks</div></div>
        <div class="stat-card violet"><div class="stat-value">${pct}%</div><div class="stat-label">Completed</div></div>
        <div class="stat-card rose"><div class="stat-value">${d.overdueTasks.length}</div><div class="stat-label">Overdue</div></div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-header"><h3>Task Breakdown</h3></div><div class="card-body"><div class="donut-chart-wrap">
          <div class="donut-chart" style="background:${bg}"><div class="donut-hole">${tot}</div></div>
          <div class="donut-legend"><div class="legend-item"><span class="legend-dot" style="background:#8b949e"></span>Todo: ${t}</div><div class="legend-item"><span class="legend-dot" style="background:#06b6d4"></span>In Progress: ${ip}</div><div class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Done: ${dn}</div></div>
        </div></div></div>
        <div class="card"><div class="card-header"><h3>Recent Activity</h3></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Task</th><th>Status</th></tr></thead><tbody>
          ${d.recentActivity.length?d.recentActivity.map(t=>`<tr><td>${t.title}</td><td><span class="badge badge-${t.status}">${t.status.replace('_',' ')}</span></td></tr>`).join(''):'<tr><td colspan="2" class="text-muted">No activity yet</td></tr>'}
        </tbody></table></div></div></div>
      </div>
      ${d.overdueTasks.length?`<div class="card mt-2"><div class="card-header"><h3 class="text-danger">⚠ Overdue Tasks</h3></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Task</th><th>Project</th><th>Due</th></tr></thead><tbody>${d.overdueTasks.map(t=>`<tr class="overdue-row"><td>${t.title}</td><td>${t.project_name||'-'}</td><td>${new Date(t.due_date).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div></div></div>`:''}`
  }catch(e){toast('Failed to load dashboard','error')}
}

/* ── Projects ───────────────────────────────────────────── */
async function pgProjects(){
  const isA=S.user.role==='admin';
  document.getElementById('app').innerHTML=wrap(`<div class="page-header"><h1>Projects</h1>${isA?'<button class="btn btn-primary" onclick="mProject()">+ New Project</button>':''}</div><div id="pg" class="projects-grid"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div>`);
  try{
    const r=await api.get('/projects'),ps=r.data.data;
    if(!ps.length){document.getElementById('pg').innerHTML=`<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><h3>No projects yet</h3><p>${isA?'Create your first project to get started.':'Ask your admin to add you to a project.'}</p>${isA?'<button class="btn btn-primary" onclick="mProject()">Create Project</button>':''}</div>`;return}
    document.getElementById('pg').innerHTML=ps.map(p=>`<div class="project-card" onclick="nav('/projects/${p.id}')"><div class="project-card-top"><h3>${p.name}</h3><p class="project-desc">${p.description||'No description provided'}</p></div><div class="project-card-bottom"><div class="avatar-stack">${av(p.owner_name||'U')}</div><div class="task-count"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>${p.done_count||0}/${p.task_count||0} done</div></div></div>`).join('')
  }catch(e){toast('Failed to load projects','error')}
}

/* ── Project Detail + Kanban ────────────────────────────── */
async function pgProjectDetail(params){
  document.getElementById('app').innerHTML=wrap(`<div id="phc"></div>
    <div class="filter-bar"><input type="text" class="form-control search-input" placeholder="Search tasks..." id="ts" oninput="renderK()"><select class="form-control filter-select" id="pf" onchange="renderK()"><option value="">All Priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
    <div class="kanban-board">
      <div class="kanban-column"><div class="kanban-column-header"><h4><span class="column-dot todo"></span>Todo <span class="column-count" id="cnt-todo">0</span></h4></div><div class="kanban-column-body" id="col-todo"></div></div>
      <div class="kanban-column"><div class="kanban-column-header"><h4><span class="column-dot in-progress"></span>In Progress <span class="column-count" id="cnt-ip">0</span></h4></div><div class="kanban-column-body" id="col-in_progress"></div></div>
      <div class="kanban-column"><div class="kanban-column-header"><h4><span class="column-dot done"></span>Done <span class="column-count" id="cnt-done">0</span></h4></div><div class="kanban-column-body" id="col-done"></div></div>
    </div>`);
  await loadProj(params.id)
}

async function loadProj(id){
  try{
    const[pR,tR]=await Promise.all([api.get(`/projects/${id}`),api.get(`/tasks?projectId=${id}`)]);
    S.cp=pR.data.data;S.tasks=tR.data.data;const p=S.cp,isA=S.user.role==='admin';
    document.getElementById('phc').innerHTML=`<div class="breadcrumb"><a href="#" onclick="nav('/projects')">Projects</a><span class="sep">›</span><span>${p.name}</span></div>
      <div class="page-header"><div><h1>${p.name}</h1><p class="text-muted mt-1">${p.description||''}</p></div>
      <div class="flex gap-2">${isA?`<button class="btn btn-secondary btn-sm" onclick="mMembers()">Members</button><button class="btn btn-primary btn-sm" onclick="mTask()">+ Task</button>`:''}</div></div>
      <div class="members-list mb-2">${p.members.map(m=>`<div class="member-chip">${av(m.name)}<span>${m.name}</span></div>`).join('')}</div>`;
    renderK()
  }catch(e){toast('Failed to load project','error')}
}

function renderK(){
  const q=(document.getElementById('ts')?.value||'').toLowerCase(),pf=document.getElementById('pf')?.value||'';
  const f=S.tasks.filter(t=>(t.title.toLowerCase().includes(q)||(t.description||'').toLowerCase().includes(q))&&(!pf||t.priority===pf));
  const cols={todo:[],in_progress:[],done:[]};f.forEach(t=>cols[t.status]?.push(t));
  ['todo','in_progress','done'].forEach(s=>{
    document.getElementById(`cnt-${s==='in_progress'?'ip':s}`).textContent=cols[s].length;
    document.getElementById(`col-${s}`).innerHTML=cols[s].length?cols[s].map(t=>{
      const can=S.user.role==='admin'||t.assigned_to===S.user.id;
      const od=t.due_date&&new Date(t.due_date)<new Date()&&t.status!=='done';
      return`<div class="kanban-card" onclick="mTaskDetail(${t.id})">
        <div class="task-title">${t.title}</div>
        <div class="task-meta"><span class="badge badge-${t.priority}"><span class="priority-dot ${t.priority}"></span>${t.priority}</span>${av(t.assigned_name||'?')}</div>
        ${t.due_date?`<div class="mt-1 ${od?'text-danger':'text-muted'}" style="font-size:.72rem">${od?'⚠ ':''}${new Date(t.due_date).toLocaleDateString()}</div>`:''}
        <div class="status-actions" onclick="event.stopPropagation()">${['todo','in_progress','done'].map(x=>`<button class="status-btn ${t.status===x?'active':''}" onclick="chgSt(${t.id},'${x}')" ${can?'':'disabled'}>${x==='in_progress'?'Progress':x==='todo'?'Todo':'Done'}</button>`).join('')}</div></div>`}).join(''):'<div class="text-muted" style="padding:20px;text-align:center;font-size:.82rem">No tasks here</div>'
  })
}

async function chgSt(id,s){try{await api.patch(`/tasks/${id}/status`,{status:s});const t=S.tasks.find(x=>x.id===id);if(t)t.status=s;renderK();toast('Updated','success')}catch(e){toast(e.response?.data?.message||'Failed','error')}}

/* ── Users ──────────────────────────────────────────────── */
async function pgUsers(){
  document.getElementById('app').innerHTML=wrap(`<div class="page-header"><h1>Team Members</h1></div><div class="card"><div class="table-wrap"><table id="ut"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody><tr><td colspan="4"><div class="skeleton" style="height:14px;margin:8px 0"></div></td></tr></tbody></table></div></div>`);
  try{const r=await api.get('/users');document.querySelector('#ut tbody').innerHTML=r.data.data.map(u=>`<tr><td><div class="flex items-center gap-2">${av(u.name)}<span>${u.name}</span></div></td><td class="text-muted">${u.email}</td><td><span class="badge badge-${u.role==='admin'?'done':'in_progress'}">${u.role}</span></td><td class="text-muted">${new Date(u.created_at).toLocaleDateString()}</td></tr>`).join('')}catch(e){toast('Failed to load users','error')}
}

/* ── Modals ─────────────────────────────────────────────── */
function openM(id,title,body,ft=''){const o=document.createElement('div');o.className='modal-overlay';o.id=id;o.innerHTML=`<div class="modal"><div class="modal-header"><h3>${title}</h3><button class="modal-close" onclick="closeM('${id}')">&times;</button></div><div class="modal-body">${body}</div>${ft?`<div class="modal-footer">${ft}</div>`:''}</div>`;document.body.appendChild(o);setTimeout(()=>o.classList.add('active'),10)}
function closeM(id){const m=document.getElementById(id);if(m){m.classList.remove('active');setTimeout(()=>m.remove(),250)}}

function mProject(){
  openM('pm','New Project',`<form id="pf2"><div class="form-group"><label>Project Name</label><input class="form-control" id="pn" required></div><div class="form-group"><label>Description</label><textarea class="form-control" id="pd"></textarea></div><button class="btn btn-primary btn-block" type="submit">Create Project</button></form>`);
  document.getElementById('pf2').onsubmit=async e=>{e.preventDefault();try{await api.post('/projects',{name:document.getElementById('pn').value,description:document.getElementById('pd').value});toast('Project created','success');closeM('pm');pgProjects()}catch(e){toast('Failed to create project','error')}}
}

async function mTask(){
  let users=[];try{const r=await api.get('/users');users=r.data.data}catch(e){}
  openM('tm','New Task',`<form id="tf"><div class="form-group"><label>Title</label><input class="form-control" id="tt" required maxlength="300"></div><div class="form-group"><label>Description</label><textarea class="form-control" id="td"></textarea></div>
    <div class="grid-2"><div class="form-group"><label>Priority</label><select class="form-control" id="tp"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div><div class="form-group"><label>Due Date</label><input type="date" class="form-control" id="tdd"></div></div>
    <div class="form-group"><label>Assign To</label><select class="form-control" id="ta"><option value="">Unassigned</option>${users.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
    <button class="btn btn-primary btn-block" type="submit">Create Task</button></form>`);
  document.getElementById('tf').onsubmit=async e=>{e.preventDefault();try{await api.post('/tasks',{projectId:S.cp.id,title:document.getElementById('tt').value,description:document.getElementById('td').value,priority:document.getElementById('tp').value,dueDate:document.getElementById('tdd').value||null,assignedTo:document.getElementById('ta').value||null});toast('Task created','success');closeM('tm');loadProj(S.cp.id)}catch(e){toast('Failed to create task','error')}}
}

async function mTaskDetail(id){
  try{const r=await api.get(`/tasks/${id}`),t=r.data.data,isA=S.user.role==='admin';
    openM('tdm',t.title,`<div class="mb-2"><span class="badge badge-${t.priority}">${t.priority}</span> <span class="badge badge-${t.status}">${t.status.replace('_',' ')}</span></div>
      <p class="text-muted">${t.description||'No description provided'}</p>
      <div class="mt-2" style="font-size:.88rem"><div class="mb-2"><strong>Due:</strong> <span class="text-muted">${t.due_date?new Date(t.due_date).toLocaleDateString():'No deadline'}</span></div><div class="mb-2"><strong>Assigned to:</strong> <span class="text-muted">${t.assigned_name||'Unassigned'}</span></div><div><strong>Created by:</strong> <span class="text-muted">${t.creator_name||'Unknown'}</span></div></div>`,
      isA?`<button class="btn btn-danger btn-sm" onclick="delTask(${t.id})">Delete Task</button>`:'')
  }catch(e){toast('Failed to load task','error')}
}

async function delTask(id){if(!confirm('Delete this task?'))return;try{await api.delete(`/tasks/${id}`);toast('Task deleted','success');closeM('tdm');loadProj(S.cp.id)}catch(e){toast('Failed','error')}}

async function mMembers(){
  let users=[];try{const r=await api.get('/users');users=r.data.data}catch(e){}
  const cur=S.cp.members.map(m=>m.id);
  openM('mm','Manage Members',`<div class="form-group"><label>Add Member</label><div class="flex gap-2"><select class="form-control" id="ams"><option value="">Select user...</option>${users.filter(u=>!cur.includes(u.id)).map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select><button class="btn btn-primary btn-sm" onclick="addMbr()">Add</button></div></div>
    <div class="mt-2"><label style="font-size:.8rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px">Current Members</label><div class="members-list mt-1">${S.cp.members.map(m=>`<div class="member-chip">${av(m.name)}<span>${m.name}</span><button class="remove-btn" onclick="rmMbr(${m.id})">&times;</button></div>`).join('')}</div></div>`)
}

async function addMbr(){const v=document.getElementById('ams').value;if(!v)return;try{await api.post(`/projects/${S.cp.id}/members`,{userId:parseInt(v)});toast('Member added','success');closeM('mm');loadProj(S.cp.id)}catch(e){toast('Failed','error')}}
async function rmMbr(uid){if(!confirm('Remove this member?'))return;try{await api.delete(`/projects/${S.cp.id}/members/${uid}`);toast('Removed','success');closeM('mm');loadProj(S.cp.id)}catch(e){toast('Failed','error')}}

route();
