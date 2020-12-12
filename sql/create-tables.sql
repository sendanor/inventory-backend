-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE domains(
    id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
	data json NOT NULL,
    "createdTime" TIMESTAMPTZ NOT NULL,
    "modifiedTime" TIMESTAMPTZ NULL,
    "deletedTime" TIMESTAMPTZ NULL,
    deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE hosts(
    id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
    "domainId" UUID NOT NULL,
    name TEXT NOT NULL,
	data json NOT NULL,
    "createdTime" TIMESTAMPTZ NOT NULL,
    "modifiedTime" TIMESTAMPTZ NULL,
    "deletedTime" TIMESTAMPTZ NULL,
    deleted boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_domain
        FOREIGN KEY("domainId")
        REFERENCES domains(id)
);

CREATE UNIQUE INDEX idx_hosts_name
    ON hosts("domainId", name);

INSERT INTO domains VALUES(
    '11111111-1111-1111-1111-111111111111',
    'Test domain 1',
    '{}',
    CURRENT_TIMESTAMP,
    NULL,
    NULL,
    false);

INSERT INTO domains VALUES(
    '22222222-2222-2222-2222-222222222222',
    'Test domain 2',
    '{}',
    CURRENT_TIMESTAMP,
    NULL,
    NULL,
    false);