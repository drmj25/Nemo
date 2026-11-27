// v9: user-controlled persistent memories and project workspace.
// Nothing is extracted from chats automatically. No patient-identifiable information.
const stamp=()=>new Date().toISOString();
const valid=id=>/^[0-9a-f-]{36}$/i.test(String(id||''));
export async function workspaceAction(env,p){
 const db=env.NEMO_DB,action=p.action;
 if(action==='workspace_list'){
  const memories=await db.prepare('SELECT id,content,category,created_at FROM nemo_memories ORDER BY created_at DESC LIMIT 100').all();
  const goals=await db.prepare("SELECT g.id,g.title,g.status,g.created_at,g.updated_at, (SELECT d.created_at FROM agent_deliverables d WHERE d.goal_id=g.id ORDER BY d.id DESC LIMIT 1) AS latest_work FROM agent_goals g ORDER BY g.updated_at DESC LIMIT 50").all();
  return {memories:memories.results,projects:goals.results};
 }
 if(action==='workspace_save'){
  const content=String(p.content||'').trim().slice(0,1000);
  const category=['decision','preference','project','note'].includes(p.category)?p.category:'note';
  if(content.length<3)return {error:'Memory must contain at least 3 characters'};
  const id=crypto.randomUUID();await db.prepare('INSERT INTO nemo_memories (id,content,category,created_at) VALUES (?,?,?,?)').bind(id,content,category,stamp()).run();return {saved:true,id};
 }
 if(action==='workspace_delete'){
  if(!valid(p.id))return {error:'Invalid memory ID'};
  await db.prepare('DELETE FROM nemo_memories WHERE id=?').bind(p.id).run();return {deleted:true};
 }
 if(action==='workspace_continue'){
  if(!valid(p.id))return {error:'Invalid project ID'};
  const prior=await db.prepare('SELECT id,title,status,context FROM agent_goals WHERE id=?').bind(p.id).first();
  if(!prior)return {error:'Project not found'};
  const previous=await db.prepare('SELECT content FROM agent_deliverables WHERE goal_id=? ORDER BY id DESC LIMIT 1').bind(p.id).first();
  const notes=await db.prepare("SELECT content FROM nemo_memories WHERE category IN ('project','decision') ORDER BY created_at DESC LIMIT 8").all();
  const instruction=String(p.instruction||'Identify the next practical steps and prepare an updated deliverable').trim().slice(0,400);
  const context=['Continue existing project. Previous project: '+prior.title,'Previous status: '+prior.status,'Previous output excerpt: '+String(previous?.content||'No deliverable yet').slice(0,1600),'Relevant manually saved notes: '+(notes.results||[]).map(x=>x.content).join(' | ').slice(0,700),'Requested next step: '+instruction].join('\n').slice(0,3400);
  // Agent goal context column is unrestricted in D1; retain bounded relevant context.
  const id=crypto.randomUUID(),t=stamp();
  await db.prepare("INSERT INTO agent_goals (id,title,context,status,created_at,updated_at,next_run) VALUES (?,?,?,'queued',?,?,?)").bind(id,('Continue: '+prior.title).slice(0,500),context,t,t,t).run();
  return {created:true,id};
 }
 return {error:'Unsupported workspace action'};
}
