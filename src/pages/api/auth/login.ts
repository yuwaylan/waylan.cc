import type {APIRoute} from 'astro';
import {randomBytes,createHash} from 'node:crypto';
import {env,siteOrigin,authConfigured} from '../../../lib/env';
import {sign,privateHeaders} from '../../../lib/security';
export const prerender=false;
export const GET:APIRoute=async({cookies,redirect})=>{
 if(!authConfigured())return new Response('管理者登入尚未設定。',{status:503,headers:privateHeaders});
 const state=randomBytes(32).toString('base64url');const verifier=randomBytes(32).toString('base64url');
 cookies.set('waylan_oauth',sign({state,verifier,exp:Date.now()+600_000},env('SESSION_SECRET')),{httpOnly:true,secure:siteOrigin().startsWith('https:'),sameSite:'lax',path:'/api/auth',maxAge:600});
 const url=new URL('https://github.com/login/oauth/authorize');url.search=new URLSearchParams({client_id:env('GITHUB_CLIENT_ID'),redirect_uri:`${siteOrigin()}/api/auth/callback`,state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
 return redirect(url.toString());
};
