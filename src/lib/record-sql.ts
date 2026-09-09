export const recordSQL = `WITH quota AS (
 INSERT INTO visit_limits (key,bucket,count) VALUES ($1,$6,1)
 ON CONFLICT (key,bucket) DO UPDATE SET count=visit_limits.count+1 WHERE visit_limits.count < 60
 RETURNING count
) INSERT INTO visits (ip_hash,ip_encrypted,path,referrer_host,country,bucket)
 SELECT $1,$2,$3,$4,$5,$6 WHERE EXISTS (SELECT 1 FROM quota)
 ON CONFLICT (ip_hash,path,bucket) DO NOTHING RETURNING id`;
