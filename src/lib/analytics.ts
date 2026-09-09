import {query} from './db';
import {env,retentionDays} from './env';
import {decryptIP,encryptIP,ipHash,normalizeIP} from './security';
import {recordSQL} from './record-sql';
export async function recordVisit(ip:string,path:string,source:string,country:string){return query(recordSQL,[ipHash(ip,env('IP_ENCRYPTION_KEY')),encryptIP(ip,env('IP_ENCRYPTION_KEY')),path,source,country,Math.floor(Date.now()/60000)]);}
export type Filters={days:number;page:number;ip:string;path:string};
export function parseFilters(params:URLSearchParams):Filters{const days=Number(params.get('days')||7);const page=Number(params.get('page')||1);return {days:[1,7,30].includes(days)?Math.min(days,retentionDays()):7,page:Number.isInteger(page)&&page>=1?Math.min(page,100000):1,ip:params.get('ip')?.trim()||'',path:params.get('path')||''};}
export async function dashboard(filters:Filters){
 const ip=filters.ip?normalizeIP(filters.ip):null;if(filters.ip&&!ip)throw new Error('INVALID_IP');
 const ipFilter=ip?ipHash(ip,env('IP_ENCRYPTION_KEY')):'';
 const days=Math.min(filters.days,retentionDays());
 const params=[days,ipFilter,filters.path];
 const where=`viewed_at >= now() - ($1::int * interval '1 day') AND ($2::text = '' OR ip_hash = $2) AND ($3::text = '' OR path = $3)`;
 const results=await Promise.all([
  query(`SELECT count(*)::int AS views,count(DISTINCT ip_hash)::int AS visitors,count(DISTINCT path)::int AS pages FROM visits WHERE ${where}`,params),
  query(`SELECT to_char(viewed_at AT TIME ZONE 'Asia/Taipei','YYYY-MM-DD') AS day,count(*)::int AS views,count(DISTINCT ip_hash)::int AS visitors FROM visits WHERE ${where} GROUP BY day ORDER BY day`,params),
  query(`SELECT path,count(*)::int AS views FROM visits WHERE ${where} GROUP BY path ORDER BY views DESC LIMIT 10`,params),
  query(`SELECT referrer_host,count(*)::int AS views FROM visits WHERE ${where} GROUP BY referrer_host ORDER BY views DESC LIMIT 8`,params),
  query(`SELECT id::text,path,ip_encrypted,country,referrer_host,viewed_at FROM visits WHERE ${where} ORDER BY viewed_at DESC,id DESC LIMIT 25 OFFSET $4`,[...params,(filters.page-1)*25]),
 ]);
 const rows=results[4].map(row=>{const {ip_encrypted,...safe}=row;let ip='金鑰無法解密';try{ip=decryptIP(String(ip_encrypted),env('IP_ENCRYPTION_KEY'));}catch{}return {...safe,ip};});
 return {summary:results[0][0],daily:results[1],pages:results[2],sources:results[3],rows,filters,retention:retentionDays(),timezone:'Asia/Taipei'};
}
export async function prune(){const visits=await query(`DELETE FROM visits WHERE viewed_at < now() - ($1::int * interval '1 day') RETURNING id`,[retentionDays()]);await query('DELETE FROM visit_limits WHERE bucket < $1',[Math.floor(Date.now()/60000)-60]);return visits.length;}
