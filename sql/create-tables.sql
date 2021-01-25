-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE domains(
    id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() PRIMARY KEY,
    version INT NOT NULL,
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
    version INT NOT NULL,
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
