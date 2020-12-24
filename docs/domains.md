# Domains

## All responses

**Headers** : `Content-Changed: <true | false>`, true if content was actually modified

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

## Get domain

**URL** : `/domains/:domain`

**Method** : `GET`

### Success Response

**Code** : `200 OK`

**Content**

```json
"payload": {
    "id": "<id>",
    "name": "Domain name",
    "data": "{...}",
    "url": "<resource url>"
}
```

### Error Responses

**Code** : `404 Not Found`, if domain was not found.

**Content**

```json
"payload": {}
```

## Get page of domains

**URL** : `/domains?page=<page>&size=<size>`

**Method** : `GET`

### Success Response

**Code** : `200 OK`

**Content**

```json
"payload": {
    "domains": [
        {
            "id": "<id>",
            "name": "Domain name 1",
            "data": "{...}",
            "url": "<resource url>"
        },
        {
            "id": "<id>",
            "name": "Domain name n",
            "data": "{...}",
            "url": "<resource url>"
        },
    ],
    "pageNumber": "<current page number>",
    "pageSize": "<requested page size>",
    "totalCount": "<total number of domains>",
    "pageCount": "<total number of pages>",
    "url": "<page url>",
}
```

## Create domain

**URL** : `/domains`

**Method** : `POST`

**Data example**

```json
{
    "name": "Domain name",
    "data": "{...}"
}
```

### Success Responses

**Code** : `201 CREATED`, if domain did not exist and was created

**Content**

```json
"payload": {
    "id": "<id>"
    "name": "Domain name",
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

## Update or create domain by id

**URL** : `/domains/:domainId`

**Method** : `PUT`

**Data example**

```json
{
    "name": "Domain name",
    "data": "{...}"
}
```

### Success Responses

**Code** : `200 OK`, if domain was updated or was already up-to-date

**Code** : `201 CREATED`, if domain did not exist and was created

**Content**

```json
"payload": {
    "id": "<id>",
    "name": "Domain name",
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

## Patch domain by name

**Note**: Only data properties present in request are updated

**URL** : `/domains/:domainName`

**Method** : `PATCH`

**Data example**

```json
{
    "name": "Domain name",
    "data": "{...}"
}
```

### Success Responses

**Code** : `200 OK`, if domain was updated or was already up-to-date

**Code** : `201 CREATED`, if domain did not exist and was created

**Content**

```json
"payload": {
    "id": "<id>",
    "name": "Domain name",
    "data": "{...}"
}
```

## Delete domain

**URL** : `/domains/:domain`

**Method** : `DELETE`

### Success Responses

**Code** : `200 OK`, if domain was deleted

**Content**

```json
"payload": {}
```

### Error Responses

**Code** : `404 Not Found`, if domain was not found.

**Content**

```json
"payload": {}
```

**Code** : `409 Conflict`, if domain has hosts.

**Content**

```json
"payload": {
    "reason": "Domain having hosts cannot be removed"
}
```
