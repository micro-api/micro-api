[![Micro API](https://micro-api.github.io/micro-api/assets/logo.svg)](http://micro-api.org)

Micro API is a media type for web APIs using hypermedia and linked data. It is fully interoperable with [JSON-LD](http://json-ld.org), and consists of a strict subset and a vocabulary.

```
Content-Type: application/vnd.micro+json
```

The current published version is **31 August 2015**, and the media type is [registered](https://www.iana.org/assignments/media-types/application/vnd.micro+json) with the [IANA](http://www.iana.org/).


## Introduction

Micro API lowers the processing complexity of JSON-LD by limiting it to a subset which can be traversed without much overhead. It also provides a minimal vocabulary for basic fields. Example payloads and HTTP requests should be considered non-normative.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification have the meaning defined in [RFC 2119](https://www.ietf.org/rfc/rfc2119).


## Vocabulary

*This section should be considered normative.*

|Property|Type|Description|
|:-|:-|:-|
|[`id`](id)|`String`, `Number`|A unique value used for identifying record(s).|
|[`meta`](meta)|`Object`|Any meta-information may go in here.|
|[`operate`](operate)|`Object`|Reserved for arbitrary operations to update an record.|
|[`error`](error)|`Object`|If a request fails for any reason, it **SHOULD** return an error.|


## Payload Restrictions

*This section should be considered normative.*

- The top level **MUST** be a singular object.
- There **MUST** be a top-level `@context` object.
- Records **MUST** be represented as an array via `@graph`.
- References **MUST** be represented as a singular object with either the `@id` property *or* the `id` property.
- The `@reverse` property **MUST** only exist on a node object.


## Entry Point

The expectation of a Micro API entry point is to enumerate types and provide links to their collections.

```http
GET /
```

```json
{
  "@context": {
    "@vocab": "http://schema.org/",
    "µ": "http://micro-api.org/"
  },
  "Person": { "@id": "/people" },
  "Movie": { "@id": "/movies" }
}
```


## Finding Records

A `GET` request **MAY** be allowed on the collection IRI for a particular type.

```http
GET /movies
```

```json
{
  "@context": {
    "@vocab": "http://schema.org/",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Movie",
    "@id": "/movies/the-matrix",
    "µ:id": "the-matrix",
    "name": "The Matrix",
    "actor": {
      "@id": "/movies/the-matrix/actors",
      "µ:id": [ "keanu-reeves", "laurence-fishburne" ]
    }
  } ]
}
```

Dereferencing an `@id` **MUST** return types corresponding to that property.

```http
GET /movies/the-matrix/actors?limit=1
```

```json
{
  "@context": {
    "@vocab": "http://schema.org/",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Person",
    "@id": "/people/keanu-reeves",
    "µ:id": "keanu-reeves",
    "name": "Keanu Reeves",
    "@reverse": {
      "actor": {
        "@id": "/people/keanu-reeves/acted-in",
        "µ:id": [ "the-matrix" ]
      }
    }
  } ]
}
```


## Creating Records

Requesting to create an record **MAY** be allowed at the collection IRI for that type. The payload **MUST** be a valid Micro API document, and referenced IDs must be specified using the `id` property.

```http
POST /people
```

```json
{
  "@context": {
    "@vocab": "http://schema.org/",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Person"
    "name": "John Doe",
    "@reverse": {
      "actor": {
        "µ:id": [ "some-movie" ]
      }
    }
  } ]
}
```

It may be helpful for the response to have a `Location` header, but it is not required since the response body may include a link to the created record.


## Updating Records

IDs **MUST** be specified in the payload per record to update, and `PATCH` requests can be made wherever the record exists (side-effect of this: IDs cannot be changed, only specified).

```http
PATCH /people
```

```json
{
  "@context": {
    "@vocab": "http://schema.org/",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Person",
    "µ:id": "john-doe",
    "additionalName": "Johnny",
    "birthPlace": {
      "µ:id": "los-angeles"
    },
    "µ:operate": { "@context": null }
  } ]
}
```

If the a specified record does not exist at the requested location, it **SHOULD** return an error. The assumption is that *the `PATCH` method replaces the fields specified*. There is a special `operate` property which allows for arbitrary updates, which this specification is agnostic about. In common update cases, it may be desirable to reject upserts (the `PUT` method defines that [a resource may be created](http://greenbytes.de/tech/webdav/draft-ietf-httpbis-p2-semantics-21.html#PUT)), so `PATCH` is typically what you want to do.

`PATCH` requests can update existing records, however Micro API does not define the semantics to create or delete resources with this method. In this example, by setting a link's `id` property to `null` (for a to-one relationship) or `[]` (empty array for a to-many relationship), it removes the link.


## Deleting Records

```http
DELETE /people/john-doe
```

A delete request can return no payload (204 No Content) if it succeeds. It can apply to any IRI, including collections.

```http
DELETE /people/john-doe/children
```

In this example, the request means delete all of a person's children, not just the link. There is no concept of relationship entities.


## Error Response

If a request fails for any reason, it **MUST** return a `error` object. The contents of the error object are opaque to this specification.

```json
{
  "@context": {
    "@vocab": "http://schema.org/",
    "µ": "http://micro-api.org/"
  },
  "µ:error": {
    "name": "NotFoundError",
    "description": "The requested record was not found."
  }
}
```


## Extending

Micro API does not specify anything about pagination, filtering, sparse fields, sorting, etc. For example, the `meta` object **MAY** contain hints on what queries can be appended to GET requests:

```json
{
  "@context": {
    "@vocab": "http://schema.org/",
    "µ": "http://micro-api.org/"
  },
  "µ:meta": {
    "@context": null,
    "include": [],
    "sort": {},
    "field": {},
    "match": {},
    "limit": 1000,
    "offset": 0,
    "count": 0
  }
}
```


## About

The source for this document is on [GitHub](https://github.com/micro-api/micro-api). It is licensed under the [CC0 1.0 License](https://raw.githubusercontent.com/micro-api/micro-api/master/LICENSE).
