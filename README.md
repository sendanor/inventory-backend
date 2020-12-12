# sendanor/inventory-backend

This is a simple REST backend for inventories (especially for Ansible).

You could also think of it as a simple database between shell scripts and web apps. See also our 
[shell client](https://github.com/sendanor/ib) for it.

### Development Status

The project currently is [actively developed](https://github.com/sendanor/inventory-backend/milestones?direction=asc&sort=due_date&state=open).

This is an unstable development version. 

The first stable release is expected to arrive later 2020/12.

### Commercial Support

Commercial support up to 10 years is available from [Sendanor](https://sendanor.com). 

We will increase the price 10% weekly after [weekly milestone is completed](https://github.com/sendanor/inventory-backend/milestones?direction=asc&sort=due_date&state=open).

Finnish customers can purchase the support plan from [our webstore](https://nor.fi/ansible). Please [contact us](https://sendanor.com), if you would like to purchase the plan from outside of Finland.

### Install

`npm i -g inventory-backend`

...or directly from our Github:

`npm i -g sendanor/inventory-backend`

## Design

 * [Design document (in finnish)](https://docs.google.com/document/d/1-DSF5jr2fu3Cj0wVkpxPMVpevg8zl7VSU86Xf5UU1co/edit?usp=sharing)

## All responses

**Headers** : `Host-Changed: <true | false>`, true if content was actually modified

**Content**

```json
{
    "timestamp": <timestamp of the response in ISO-8601 format>
    "changed": <true | false>,
    "payload": ...
}
```

### Error Responses

**Code** : `400 Bad Request`, if request URI or body is invalid

**Content**

```json
"payload": {
    "reason": "Invalid request"
}
```
**Code** : `500 Internal Server Error`, if unknown server error occurs

**Content**

```json
"payload": {
    "reason": "Internal server error"
}
```

## Get host

**URL** : `/hosts/:id` or `/hosts/:name`

**Method** : `GET`

### Success Response

**Code** : `200 OK`

**Content**

```json
"payload": {
    "id": <id>,
    "name": "Host name",
    "data": {...}
}
```

### Error Responses

**Code** : `404 Not Found`, if host was not found.

**Content**

```json
"payload": {}
```

## Get page of hosts

**URL** : `/hosts?page=<page>&size=<size>`

**Method** : `GET`

### Success Response

**Code** : `200 OK`

**Content**

```json
"payload": {
    "hosts": [
        {
            "id": <id>,
            "name": "Host name 1",
            "data": {...}
        },
        ...
    ],
    "totalCount": <total number of hosts>,
    "pageCount": <total number of pages>
}
```

## Create host

**URL** : `/hosts`

**Method** : `POST`

**Data example**

```json
{
    "name": "Host name",
    "data": {...}
}
```
### Success Responses

**Code** : `201 CREATED`, if host did not exist and was created

**Content**

```json
"payload": {
    "id": <id>
    "name": "Host name",
    "data": {...}
}
```

### Error Responses

**Code** : `409 Conflict`, if name is already in use

**Content**

```json
"payload": {
    "reason": "Name already exists"
}
```

## Update or create host by id

**URL** : `/hosts/:id`

**Method** : `PUT`

**Data example**

```json
{
    "name": "Host name",
    "data": {...}
}
```
### Success Responses

**Code** : `200 OK`, if host was updated or was already up-to-date

**Code** : `201 CREATED`, if host did not exist and was created

**Content**

```json
"payload": {
    "id": <id>
    "name": "Host name",
    "data": {...}
}
```

### Error Responses

**Code** : `409 Conflict`, if name is already in use

**Content**

```json
"payload": {
    "reason": "Name already exists"
}
```

## Patch host by name

**Note**: Only data properties present in request are updated

**URL** : `/hosts`

**Method** : `PATCH`

**Data example**

```json
{
    "name": "Host name",
    "data": {...}
}
```
### Success Responses

**Code** : `200 OK`, if host was updated or was already up-to-date

**Code** : `201 CREATED`, if host did not exist and was created

**Content**

```json
"payload": {
    "id": <id>
    "name": "Host name",
    "data": {...}
}
```

## Delete host

**URL** : `/hosts/:id` or `/hosts/:name`

**Method** : `DELETE`

### Success Responses

**Code** : `200 OK`, if host was deleted

**Content**

```json
"payload": {}
```

### Error Responses

**Code** : `404 Not Found`, if host was not found.

**Content**

```json
"payload": {}
```
