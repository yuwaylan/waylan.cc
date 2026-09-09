import type {APIRoute} from 'astro';
import {localRequest,setSession} from '../../../lib/auth';
import {env,siteOrigin} from '../../../lib/env';
import {sameOrigin,json} from '../../../lib/security';
export const prerender=false;
export const POST:APIRoute=ctx=>{if(!localRequest(ctx))return json({error:'Not found'},404);if(!sameOrigin(ctx.request,siteOrigin()))return json({error:'Forbidden'},403);setSession(ctx.cookies,env('ADMIN_GITHUB_ID'),'local-preview');return ctx.redirect('/admin/',303);};
