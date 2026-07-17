import type { CaseEnvironment } from '../../../simulation/terminal/caseEnvironment';
import { runLocalHttpCommand, type LocalHttpExchange } from '../../../simulation/http/localHttp';
import { runLocalSqlCommand, type LocalSqlTable } from '../../../simulation/data/localSql';

function pick<T>(seed:number, values:T[]):T { return values[Math.abs(seed)%values.length]; }

export function createMarshrutEnvironment(seed:number) {
  const session = `sid_${(seed>>>0).toString(36).slice(0,6)}`;
  const user = pick(seed,['courier-17','courier-24','dispatcher-06']);
  const normalIp = pick(seed+1,['10.44.8.17','10.44.8.24','10.44.9.6']);
  const remoteIp = pick(seed+2,['203.0.113.44','198.51.100.72','192.0.2.93']);
  const routeId = 700 + (Math.abs(seed)%80);
  const home='/home/ilya/marshrut/case-01';
  const httpArtifact='artifact.route.http';
  const exchanges:LocalHttpExchange[]=[
    {id:'req-login',method:'POST',path:'/api/session',requestHeaders:{Host:'local.marshrut.lab','Content-Type':'application/json','X-Source-IP':normalIp},requestBody:`{"user":"${user}"}`,status:200,reason:'OK',responseHeaders:{'Set-Cookie':`${session}; HttpOnly; SameSite=Lax`,'Content-Type':'application/json'},responseBody:`{"user":"${user}","result":"authenticated"}`,artifactId:httpArtifact},
    {id:'req-route',method:'GET',path:`/api/routes/${routeId}`,requestHeaders:{Host:'local.marshrut.lab',Cookie:session,'X-Source-IP':normalIp},status:200,reason:'OK',responseHeaders:{'Content-Type':'application/json','X-Request-ID':'r-201'},responseBody:`{"route_id":${routeId},"stops":14}`,artifactId:httpArtifact},
    {id:'req-export',method:'POST',path:`/api/routes/${routeId}/export`,requestHeaders:{Host:'local.marshrut.lab',Cookie:session,'X-Source-IP':remoteIp},status:200,reason:'OK',responseHeaders:{'Content-Type':'application/json','X-Request-ID':'r-209'},responseBody:`{"export":"created","route_id":${routeId}}`,artifactId:httpArtifact},
  ];
  const tables:LocalSqlTable[]=[
    {name:'sessions',columns:['session_id','user_id','created_at','created_ip'],artifactId:'artifact.route.sessions',rows:[{session_id:session,user_id:user,created_at:'2026-03-17T18:11:02Z',created_ip:normalIp}]},
    {name:'request_audit',columns:['ts','request_id','session_id','source_ip','action','route_id'],artifactId:'artifact.route.audit',rows:[
      {ts:'2026-03-17T18:11:02Z',request_id:'r-190',session_id:session,source_ip:normalIp,action:'session_create',route_id:null},
      {ts:'2026-03-17T18:13:18Z',request_id:'r-201',session_id:session,source_ip:normalIp,action:'route_view',route_id:routeId},
      {ts:'2026-03-17T18:27:44Z',request_id:'r-209',session_id:session,source_ip:remoteIp,action:'route_export',route_id:routeId},
    ]},
  ];
  const files:CaseEnvironment['files']={
    [`${home}/brief.txt`]:{path:`${home}/brief.txt`,artifactId:'artifact.route.brief',content:'Локальная копия сервиса. Восстанови HTTP/session timeline. Не передавай cookie или полные маршруты заказчику.'},
    [`${home}/access.jsonl`]:{path:`${home}/access.jsonl`,artifactId:'artifact.route.access',content:[
      `{"ts":"2026-03-17T18:11:02Z","request_id":"r-190","session":"${session}","src":"${normalIp}","path":"/api/session","status":200}`,
      `{"ts":"2026-03-17T18:13:18Z","request_id":"r-201","session":"${session}","src":"${normalIp}","path":"/api/routes/${routeId}","status":200}`,
      `{"ts":"2026-03-17T18:27:44Z","request_id":"r-209","session":"${session}","src":"${remoteIp}","path":"/api/routes/${routeId}/export","status":200}`,
      `{"ts":"2026-03-17T18:28:00Z","request_id":"r-noise","session":"sid_health","src":"10.44.1.5","path":"/health","status":200}`,
    ].join('\n')},
  };
  const environment:CaseEnvironment={seed,home,files,directories:[home],facts:{session,user,normalIp,remoteIp,routeId},customCommand:({tool,args})=>tool==='http'?runLocalHttpCommand(exchanges,args):tool==='sql'?runLocalSqlCommand(tables,args):null,detectFinding:({raw,stdout,tools})=>{
    const text=stdout.join('\n'); const lower=raw.toLowerCase();
    if((tools.includes('sql')&&lower.includes('order by ts')&&text.includes('r-190')&&text.includes('r-209'))||(tools.includes('sort')&&text.includes('r-190')&&text.includes('r-209'))) return 'route-timeline';
    if((tools.includes('sql')||tools.includes('grep'))&&text.includes('route_export')&&text.includes('r-209')) return 'route-export';
    if(tools.includes('sql')&&text.includes(normalIp)&&text.includes(remoteIp)&&text.includes(session)) return 'route-session-reuse';
    if(tools.includes('http')&&text.includes('Set-Cookie:')&&text.includes('200 OK')) return 'route-http-session';
    return undefined;
  }};
  return {shell:environment,session,user,normalIp,remoteIp,routeId};
}
