import type {APIRoute} from 'astro';
import {COOKIE} from '../../../lib/auth';
import {sameOrigin,json} from '../../../lib/security';
import {siteOrigin} from '../../../lib/env';
export const prerender=false;
export const POST:APIRoute=({request,cookies,redirect})=>{if(!sameOrigin(request,siteOrigin()))return json({error:'Forbidden'},403);cookies.delete(COOKIE,{path:'/'});return redirect('/admin/login/',303);};
