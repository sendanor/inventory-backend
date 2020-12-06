DROP TABLE IF EXISTS hosts;

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE hosts (
    id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
	data json NOT NULL,
    createdTime TIMESTAMPTZ NOT NULL,
    modifiedTime TIMESTAMPTZ NULL,
    deletedTime TIMESTAMPTZ NULL,
    deleted boolean NOT NULL DEFAULT false
);
