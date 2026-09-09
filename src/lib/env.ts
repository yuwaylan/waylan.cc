export function env(name:string):string{return process.env[name] || import.meta.env?.[name] || '';}
export function localMode(){return Boolean(import.meta.env?.DEV) && !env('VERCEL') && env('LOCAL_DEVELOPMENT')==='true';}
export function siteOrigin(){return env('SITE_URL') || (localMode()?'http://127.0.0.1:4321':'https://waylan.cc');}
export function retentionDays(){const n=Number(env('ANALYTICS_RETENTION_DAYS')||30);return Number.isInteger(n)&&n>=1&&n<=90?n:30;}
export function authConfigured(){return env('SESSION_SECRET').length>=32 && Boolean(env('GITHUB_CLIENT_ID')) && Boolean(env('GITHUB_CLIENT_SECRET')) && /^\d+$/.test(env('ADMIN_GITHUB_ID'));}
