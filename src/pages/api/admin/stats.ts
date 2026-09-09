import type {APIRoute} from 'astro';
import {adminSession} from '../../../lib/auth';
import {dashboard,parseFilters} from '../../../lib/analytics';
import {dbConfigured} from '../../../lib/db';
import {json} from '../../../lib/security';
export const prerender=false;
export const GET:APIRoute=async({cookies,url})=>{if(!adminSession(cookies))return json({error:'Unauthorized'},401);if(!dbConfigured())return json({error:'尚未連接資料庫。'},503);try{return json(await dashboard(parseFilters(url.searchParams)));}catch(e){return json({error:e instanceof Error&&e.message==='INVALID_IP'?'請輸入完整有效的 IPv4 或 IPv6 位址。':'無法讀取統計，請確認資料庫連線與 migration。'},e instanceof Error&&e.message==='INVALID_IP'?400:503);}};
