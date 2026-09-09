CREATE TABLE IF NOT EXISTS visits (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ip_hash char(64) NOT NULL,
 ip_encrypted text NOT NULL,
 path varchar(180) NOT NULL,
 referrer_host varchar(253) NOT NULL DEFAULT '',
 country varchar(2) NOT NULL DEFAULT '',
 bucket bigint NOT NULL,
 viewed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (ip_hash, path, bucket)
);
CREATE INDEX IF NOT EXISTS visits_time_idx ON visits (viewed_at DESC);
CREATE INDEX IF NOT EXISTS visits_ip_time_idx ON visits (ip_hash, viewed_at DESC);
CREATE TABLE IF NOT EXISTS visit_limits (
 key char(64) NOT NULL,
 bucket bigint NOT NULL,
 count integer NOT NULL DEFAULT 1,
 PRIMARY KEY (key, bucket)
);
