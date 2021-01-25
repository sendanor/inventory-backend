# Hosts

## All responses

**Headers** : `Domain-Changed: <true | false>`, true if content was actually modified

**Content**

```json
{
    "timestamp": "<timestamp of the response in ISO-8601 format>",
    "changed": "<true | false>",
    "payload": "{...}"
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

**URL** : `/domains/:domain/hosts/:host`

**Method** : `GET`

### Success Response

**Code** : `200 OK`

**Content**

```json
"payload": {
    "id": "<id>",
    "name": "Host name",
    "data": "{...}",
    "url": "<resource url>"
}
```

### Error Responses

**Code** : `404 Not Found`, if host was not found.

**Content**

```json
"payload": {}
```

## Get page of hosts

**URL** : `/domains/:domain/hosts?page=<page>&size=<size>&search=<search string>`

**Note** : Search string is optional. The search is case-insensitive and matches any substring in the host name.

**Method** : `GET`

### Success Response

**Code** : `200 OK`

**Content**

```json
"payload": {
    "hosts": [
        {
            "id": "<id>",
            "name": "Host name 1",
            "data": "{...}",
            "url": "<resource url>",
        },
        {
            "id": "<id>",
            "name": "Host name n",
            "data": "{...}",
            "url": "<resource url>",
        },
    ],
    "pageNumber": "<current page number>",
    "pageSize": "<requested page size>",
    "totalCount": "<total number of hosts>",
    "pageCount": "<total number of pages>",
    "url": "<page url>",
}
```

## Create host

**URL** : `/domains/:domain/hosts`

**Method** : `POST`

**Data example**

```json
{
    "name": "Host name",
    "data": "{...}"
}
```

### Success Responses

**Code** : `201 CREATED`, if host did not exist and was created

**Content**

```json
"payload": {
    "id": "<id>",
    "name": "Host name",
    "data": "{...}"
}
```

### Error Responses

**Code** : `409 Conflict`, if name is already in use for this domain

**Content**

```json
"payload": {
    "reason": "Name already exists"
}
```

## Update or create host by id

**URL** : `/domains/:domain/hosts/:hostId`

**Method** : `PUT`

**Data example**

```json
{
    "name": "Host name",
    "data": "{...}"
}
```

### Success Responses

**Code** : `200 OK`, if host was updated or was already up-to-date

**Code** : `201 CREATED`, if host did not exist and was created

**Content**

```json
"payload": {
    "id": "<id>",
    "name": "Host name",
    "data": "{...}"
}
```

### Error Responses

**Code** : `409 Conflict`, if name is already in use for this domain

**Content**

```json
"payload": {
    "reason": "Name already exists"
}
```

## Patch host by name

**Note**: Only data properties present in request are updated

**URL** : `/domains/:domain/hosts/:hostName`

**Method** : `PATCH`

**Data example**

```json
{
    "name": "Host name",
    "data": "{...}"
}
```

### Success Responses

**Code** : `200 OK`, if host was updated or was already up-to-date

**Code** : `201 CREATED`, if host did not exist and was created

**Content**

```json
"payload": {
    "id": "<id>",
    "name": "Host name",
    "data": "{...}"
}
```

## Delete host

**URL** : `/domains/:domain/hosts/:host`

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
