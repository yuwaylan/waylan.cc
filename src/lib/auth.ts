import type {APIContext} from 'astro';
import {env,localMode,siteOrigin} from './env';
import {sign,verify,privateHeaders} from './security';
export type Session={kind:'admin';id:string;login:string;exp:number};
export const COOKIE='waylan_admin';
export function adminSession(cookies:APIContext['cookies']):Session|null{const session=verify<Session>(cookies.get(COOKIE)?.value,env('SESSION_SECRET'));if(!session||session.kind!=='admin'||session.id!==env('ADMIN_GITHUB_ID'))return null;return session;}
export function setSession(cookies:APIContext['cookies'],id:string,login:string){cookies.set(COOKIE,sign({kind:'admin',id,login,exp:Date.now()+8*3600_000},env('SESSION_SECRET')),{path:'/',httpOnly:true,secure:!localMode(),sameSite:'lax',maxAge:8*3600});}
export function localRequest(ctx:APIContext){return localMode()&&['127.0.0.1','::1'].includes(ctx.clientAddress)&&ctx.url.origin===siteOrigin();}
export function noCache(ctx:{response:{headers:Headers}}){for(const [k,v] of Object.entries(privateHeaders))ctx.response.headers.set(k,v);}
