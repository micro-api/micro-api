[![Micro API](https://micro-api.github.io/micro-api/assets/logo.svg)](http://micro-api.org)

Micro API is a media type for web APIs using hypermedia and linked data. This specification is a subset of [JSON-LD](http://json-ld.org) to simplify processing, so that all Micro API documents are also JSON-LD documents, but not vice-versa. Micro API adds semantics of its own.

```
Content-Type: application/vnd.micro+json
```

The current published version is **12 July 2015**, and the media type is [registered](https://www.iana.org/assignments/media-types/application/vnd.micro+json) with the [IANA](http://www.iana.org/).


## Introduction

Micro API is only concerned with the structure of the payload, and does not restrict how the server should implement the application protocol (typically HTTP). Example payloads and HTTP requests should be considered non-normative. It should adhere to [Roy Fielding's definition of REST](http://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven) as closely as possible.

The base specification's [H-Factor](http://amundsen.com/hypermedia/hfactor/) supports LE, LO, LN, LI, CL (similar to [Atom](https://en.wikipedia.org/wiki/Atom_%28standard%29)), but could support all of the H-Factors by extending the base specification. Implementation features such as pagination, filtering, sorting, etc. are opaque to this specification.


## Reading this Document

Micro API extends the generic JSON media type, defined in [RFC 4627](https://www.ietf.org/rfc/rfc4627), and more specifically the [JSON-LD](http://json-ld.org) media type.

This specification uses the terms [IRI](https://en.wikipedia.org/wiki/Internationalized_resource_identifier), [API](https://en.wikipedia.org/wiki/Web_API), [hypermedia](https://en.wikipedia.org/wiki/Hypermedia), & [linked data](https://en.wikipedia.org/wiki/Linked_data) accordingly.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification have the meaning defined in [RFC 2119](https://www.ietf.org/rfc/rfc2119).


## Key Concepts

- The specification is concerned with representing the relationship graph between types.
- Interoperability with JSON-LD is a primary concern of this specification. A JSON-LD client may be able to parse a Micro API document, but without the additional semantics.
- The `@context` object from JSON-LD is intentionally unspecified. Micro API does not restrict ad-hoc record types, but its structure enables context to be added.
- Assume that the application protocol controls the flow of the interaction (HTTP `OPTIONS`, `GET`, `POST`, `PATCH`, `DELETE`).


## Reserved Keywords

*This section should be considered as normative.*

All reserved keywords are prefixed with the symbol `@`. Here is an enumeration of all of the reserved keywords:

| Key          | Type       | Description                                     |
|:-------------|:-----------|:------------------------------------------------|
| `@array`     | `Boolean`  | Indicates whether or not a relationship is to many. |
| `@type`      | `String`   | Type of a record. |
| `@inverse`   | `null`, `String` | A link **MUST** define an inverse link if it is bi-directional. |
| `@id`        | `null`, `String` | Each record and relationship **MUST** have an ID. |
| `@graph`     | `Object`   | Container for records. |
| `@links`     | `Object`   | An object describing the relationship graph. |
| `@meta`      | `Object`   | Anything goes here, it's the junk drawer. |
| `@operate`   | `Object`   | Reserved for arbitrary operations to update an record. |
| `@error`     | `Object`   | If a request fails for any reason, it **MUST** return an error. |

The reserved keywords `@id`, `@type`, and `@graph` overlap with [JSON-LD](http://www.w3.org/TR/json-ld/), and **SHOULD** be used interchangeably.


## Payload Structure

*This section should be considered as normative.*

There are certain restrictions on what can exist in the payload in different contexts. Here is an enumeration of restrictions:

- The top level object **MUST** only contain `@meta`, `@error`, `@links`, or `@graph`.
- Every record and relationship **MUST** contain at least an `@id` field.
- The top-level `@links` object **MUST** enumerate `@type` by field, and each field **MUST** be valued as an object with at least a `@id` field that refers to the collection of records of that type.
- `@type` and `@array` **MUST** exist on a relationship field object in the top-level `@links` object.


## Entry Point

This is significant for client discovery, think of it as the home page. At least a top-level `@links` object **MUST** be present.

```http
GET /
```

```json
{
  "@links": {
    "user": {
      "@id": "/users",
      "posts": {
        "@type": "post",
        "@array": true,
        "@inverse": "author"
      }
    },
    "post": {
      "@id": "/posts",
      "author": {
        "@type": "user",
        "@array": false,
        "@inverse": "posts"
      }
    }
  }
}
```

The top-level `@links` **MUST** enumerate all types and each type **MUST** include the `@id` link per collection. Within a type object, fields that are links **MUST** be enumerated. This lays out the relationship graph between types.


## Finding Records

A `GET` request **MAY** be allowed on the collection IRI for a particular type.

```http
GET /users
```

```json
{
  "@graph": [{
    "@type": "user",
    "@id": "/users/1",
    "id": "1",
    "name": "Dali Zheng",
    "posts": {
      "@id": "/users/1/posts",
      "id": ["1"]
    }
  }]
}
```

The top-level **MUST** include a `@graph` object. There is no concept of primary versus included documents, it is up to the client to consider which records were requested.

The `@array` field gives hints for what may be expected in a link object. The corresponding identifier `id` **SHOULD** match the `@array` value of the top-level `@links`.

Following the `@id` within a link object **MUST** return records corresponding to that field.

```http
GET /users/1/posts
```

```json
{
  "@graph": [{
    "@type": "post",
    "@id": "/posts/1",
    "id": "1",
    "message": "Micro API is a hypermedia serialization format.",
    "author": {
      "@id": "/posts/1/author",
      "id": "1"
    }
  }]
}
```


## Creating Records

Requesting to create an record **MAY** be allowed at the collection IRI for that type.

```http
POST /posts
```

```json
{
  "@graph": [{
    "@type": "post",
    "message": "Micro API is a hypermedia serialization format.",
    "author": {
      "id": "1"
    }
  }]
}
```

It may be helpful for the response to have a `Location` header, but it is not required since the response body may include a link to the created record. The specification is agnostic about whether client side IDs can be specified.


## Updating Records

IDs **SHOULD** be specified in the payload per record to update, and `PATCH` requests can be made wherever the record exists (side-effect of this: IDs cannot be changed, only specified).

```http
PATCH /posts
```

```json
{
  "@graph": [{
    "@type": "post",
    "id": "1",
    "message": "I like turtles.",
    "author": {
      "id": "1"
    },
    "@operate": {}
  }]
}
```

If the a specified record does not exist at the requested location, it **SHOULD** return an error. The assumption is that *the `PATCH` method replaces the fields specified*. There is a special reserved key `@operate` which allows for arbitrary updates, which this specification is agnostic about. In common update cases, it may be desirable to reject upserts (the `PUT` method defines that [a resource may be created](http://greenbytes.de/tech/webdav/draft-ietf-httpbis-p2-semantics-21.html#PUT)), so `PATCH` is typically what you want to do.

`PATCH` requests can update existing records, however Micro API does not define the semantics to create or delete resources with this method. In this example, by setting a link's `id` property to `null` (for a to-one relationship) or `[]` (empty array for a to-many relationship), it removes the link.


## Deleting Records

```http
DELETE /posts/1
```

A delete request can return no payload (204 No Content) if it succeeds. It can apply to any IRI, including collections.

```http
DELETE /users/1/posts
```

In this example, the request means delete all of a users' posts, not just the link. There is no concept of relationship entities.


## Error Payload

If a request fails for any reason, it **MUST** return a `@error` object. The contents of the error object are opaque to this specification.

```json
{
  "@error": {
    "title": "NotFoundError",
    "message": "The requested record was not found."
  }
}
```


## Extending

Micro API does not specify anything about pagination, filtering, sparse fields, sorting, etc, since these may be coupled with the implementation of the application protocol. For example, the `@meta` object **MAY** contain hints on what queries can be appended to GET requests:

```json
{
  "@meta": {
    "include": [],
    "sort": {},
    "field": {},
    "match": {},
    "limit": 1000,
    "offset": 0
  }
}
```

Additional features **MUST** be additive and optional, and can not conflict with the base specification.

Micro API does not restrict arbitrary keys except where it is necessary, such as in the `@links` object. For example, a link object can embed additional meta-information about the link:

```json
{
  "order": [{
    "@id": "/orders/1",
    "id": "1",
    "customer": {
      "@id": "/orders/1/customer",
      "id": "1",
      "timesOrdered": 7,
      "lastShipped": "2015-04-30"
    }
  }]
}
```


## Caveats

Do not use this media type if:

- Your records do not have unique IDs. This shouldn't be too much of a burden.
- Your API requires polymorphic types in links. Micro API does not define the semantics to express this, and is in fact designed to restrict this use case.


## About

The source for this document is on [GitHub](https://github.com/micro-api/micro-api). It is licensed under the [CC0 1.0 License](https://raw.githubusercontent.com/micro-api/micro-api/master/LICENSE).
