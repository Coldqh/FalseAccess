import type { CaseEnvironment } from '../../../simulation/terminal/caseEnvironment';
import { runLocalHttpCommand, type LocalHttpExchange } from '../../../simulation/http/localHttp';
import { runLocalSqlCommand, type LocalSqlTable } from '../../../simulation/data/localSql';
function pick<T>(seed:number,v:T[]):T{return v[Math.abs(seed)%v.length];}
export function createMarshrutCheckEnvironment(seed:number){
 const home='/home/ilya/marshrut/check-01'; const good=`sid_good_${(seed>>>0).toString(36).slice(0,4)}`; const bad=`sid_bad_${((seed+9)>>>0).toString(36).slice(0,4)}`; const remote=pick(seed,['198.51.100.31','203.0.113.61','192.0.2.81']); const user='dispatcher-11';
 const exchanges:LocalHttpExchange[]=[
  {id:'q-401',method:'GET',path:'/api/profile',requestHeaders:{Host:'local.dispatch.lab',Cookie:good,'X-Source-IP':'100.64.4.8'},status:200,reason:'OK',responseHeaders:{'X-Request-ID':'q-401'},responseBody:'{"profile":"ok"}',artifactId:'artifact.routecheck.http'},
  {id:'q-418',method:'POST',path:'/api/clients/export',requestHeaders:{Host:'local.dispatch.lab',Cookie:bad,'X-Source-IP':remote},status:200,reason:'OK',responseHeaders:{'X-Request-ID':'q-418'},responseBody:'{"export":"created","rows":48}',artifactId:'artifact.routecheck.http'},
 ];
 const tables:LocalSqlTable[]=[{name:'session_events',columns:['ts','session_id','user_id','source_ip','action','request_id'],artifactId:'artifact.routecheck.sessions',rows:[
  {ts:'2026-03-19T09:01:00Z',session_id:good,user_id:user,source_ip:'100.64.4.8',action:'profile_view',request_id:'q-401'},
  {ts:'2026-03-19T09:08:00Z',session_id:good,user_id:user,source_ip:'100.64.7.9',action:'profile_view',request_id:'q-407'},
  {ts:'2026-03-19T09:12:00Z',session_id:bad,user_id:'support-04',source_ip:'10.61.4.4',action:'session_create',request_id:'q-410'},
  {ts:'2026-03-19T09:17:00Z',session_id:bad,user_id:'support-04',source_ip:remote,action:'client_export',request_id:'q-418'},
 ]},{name:'change_tickets',columns:['ticket_id','user_id','window','description'],artifactId:'artifact.routecheck.changes',rows:[{ticket_id:'CHG-441',user_id:user,window:'09:00-09:20Z',description:'mobile carrier failover test'}]}];
 const files:CaseEnvironment['files']={
  [`${home}/brief.txt`]:{path:`${home}/brief.txt`,artifactId:'artifact.routecheck.brief',content:'Неизвестная session anomaly. Отдели штатную смену сети от реального reuse и подтвердить export.'},
  [`${home}/access.jsonl`]:{path:`${home}/access.jsonl`,artifactId:'artifact.routecheck.access',content:tables[0].rows.map(r=>JSON.stringify(r)).join('\n')},
 };
 const shell:CaseEnvironment={seed,home,files,directories:[home],facts:{good,bad,remote},customCommand:({tool,args})=>tool==='http'?runLocalHttpCommand(exchanges,args):tool==='sql'?runLocalSqlCommand(tables,args):null,detectFinding:({raw,stdout,tools})=>{const t=stdout.join('\n');const l=raw.toLowerCase();if((tools.includes('sql')&&l.includes('order by ts')&&t.includes('q-410')&&t.includes('q-418'))||(tools.includes('sort')&&t.includes('q-410')&&t.includes('q-418')))return'routecheck-timeline';if(tools.includes('sql')&&t.includes('mobile carrier failover test'))return'routecheck-benign';if(tools.includes('sql')&&t.includes(bad)&&t.includes(remote)&&t.includes('client_export'))return'routecheck-reuse';if(tools.includes('http')&&t.includes('/api/clients/export')&&t.includes('200 OK'))return'routecheck-export';return undefined;}};
 return{shell,good,bad,remote};
}
