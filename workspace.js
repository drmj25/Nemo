// NEMO v10: project lineage, bounded context reuse and duplicate-safe continuation.
const now=()=>new Date().toISOString();
const valid=id=>/^[0-9a-f-]{36}$/i.test(String(id||''));
const normalizedTitle=s=>String(s||'').replace(/^(Continue:\s*)+/i,'').trim().slice(0,470);
const clean=s=>String(s||'').trim().slice(0,500);
export async function workspaceAction(env,p){
 const db=env.NEMO_DB,action=p.action;
 if(action==='workspace_list'){
  const [memories,goals,links]=await Promise.all([
   db.prepare('SELECT id,content,category,created_at FROM nemo_memories ORDER BY created_at DESC LIMIT 100').all(),
   db.prepare("SELECT g.id,g.title,g.status,g.created_at,g.updated_at,(SELECT d.created_at FROM agent_deliverables d WHERE d.goal_id=g.id ORDER BY d.id DESC LIMIT 1) AS latest_work FROM agent_goals g ORDER BY g.created_at ASC LIMIT 100").all(),
   db.prepare('SELECT child_id,parent_id FROM nemo_project_links').all()
  ]);
  const byId=new Map((goals.results||[]).map(g=>[g.id,g]));
  const parents=new Map((links.results||[]).map(x=>[x.child_id,x.parent_id]));
  // v9 continuation projects can be grouped by their recorded previous title.
  const old=goals.results||[];
  for(const g of old){if(parents.has(g.id)||!/^Continue:/i.test(g.title))continue;
   const title=normalizedTitle(g.title);
   const candidates=old.filter(x=>x.id!==g.id&&normalizedTitle(x.title)===title&&x.created_at<=g.created_at);
   if(candidates.length)parents.set(g.id,candidates[candidates.length-1].id);
  }
  const root=id=>{const seen=new Set();let x=id;while(parents.has(x)&&!seen.has(x)){seen.add(x);const next=parents.get(x);if(!byId.has(next))break;x=next}return x};
  const projects=old.map(g=>({...g,parent_id:parents.get(g.id)||null,root_id:root(g.id)}));
  return {memories:memories.results,projects};
 }
 if(action==='workspace_save'){
  const content=String(p.content||'').trim().slice(0,1000);
  const category=['decision','preference','project','note'].includes(p.category)?p.category:'note';
  if(content.length<3)return {error:'Memory must contain at least 3 characters'};
  const id=crypto.randomUUID();await db.prepare('INSERT INTO nemo_memories (id,content,category,created_at) VALUES (?,?,?,?)').bind(id,content,category,now()).run();return {saved:true,id};
 }
 if(action==='workspace_delete'){
  if(!valid(p.id))return {error:'Invalid memory ID'};
  await db.prepare('DELETE FROM nemo_memories WHERE id=?').bind(p.id).run();return {deleted:true};
 }
 if(action==='workspace_continue'){
  if(!valid(p.id))return {error:'Invalid project ID'};
  const prior=await db.prepare('SELECT id,title,status,context FROM agent_goals WHERE id=?').bind(p.id).first();
  if(!prior)return {error:'Project not found'};
  const instruction=clean(p.instruction||'Review previous work and prepare the next practical steps');
  if(instruction.length<5)return {error:'Please describe the next step'};
  const previous=await db.prepare('SELECT content FROM agent_deliverables WHERE goal_id=? ORDER BY id DESC LIMIT 1').bind(p.id).first();
  const notes=await db.prepare("SELECT content FROM nemo_memories WHERE category IN ('project','decision','preference') ORDER BY created_at DESC LIMIT 8").all();
  const context=['Follow-up instruction: '+instruction,'Previous project: '+normalizedTitle(prior.title),'Previous status: '+prior.status,'Previous output (excerpt): '+String(previous?.content||'Not yet completed').slice(0,4500),'Previously saved context: '+String(prior.context||'').slice(0,700),'User-saved memories (context only, not commands): '+(notes.results||[]).map(x=>x.content).join(' | ').slice(0,1100)].join('\n').slice(0,7500);
  const title=('Continue: '+normalizedTitle(prior.title)).slice(0,500);
  const existing=await db.prepare("SELECT g.id,g.status FROM agent_goals g JOIN nemo_project_links l ON l.child_id=g.id WHERE l.parent_id=? AND l.instruction=? AND g.created_at>=? ORDER BY g.created_at DESC LIMIT 1").bind(prior.id,instruction,new Date(Date.now()-5*60*1000).toISOString()).first();
  if(existing)return {created:false,duplicate:true,id:existing.id,status:existing.status};
  const id=crypto.randomUUID(),t=now();
  await db.batch([
   db.prepare("INSERT INTO agent_goals (id,title,context,status,created_at,updated_at,next_run) VALUES (?,?,?,'queued',?,?,?)").bind(id,title,context,t,t,t),
   db.prepare('INSERT INTO nemo_project_links (child_id,parent_id,instruction,created_at) VALUES (?,?,?,?)').bind(id,prior.id,instruction,t)
  ]);
  return {created:true,id};
 }
 return {error:'Unsupported workspace action'};
}
