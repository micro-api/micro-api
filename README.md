[![Micro API](https://micro-api.github.io/micro-api/assets/logo.svg)](http://micro-api.org)

Micro API is a media type for web APIs using hypermedia. The specification covers basic requirements for hypermedia APIs that use JSON as a format.

```
Content-Type: application/vnd.micro+json
```

The media type is [registered](http://www.iana.org/assignments/media-types) with the [IANA](http://www.iana.org/).


## Introduction

Micro API is only concerned with the structure of the payload, and does not restrict how the server should implement the application protocol (typically HTTP). Example payloads and HTTP requests should be considered non-normative.

The base specification's [H-Factor](http://amundsen.com/hypermedia/hfactor/) supports LE, LO, LN, LI, but could support all of the H-Factors by extending the base specification. Concepts such as querying, schemas, and linked data are opaque to this specification. It should follow [Roy Fielding's definition of REST](http://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven) as closely as possible. The contracts of this media type are designed to *never change*, it is considered final and only open for clarification.


## Reading this Document

Micro API extends the generic JSON media type, defined in [RFC 4627](https://www.ietf.org/rfc/rfc4627).

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification have the meaning defined in [RFC 2119](https://www.ietf.org/rfc/rfc2119).


## Key Concepts

- A type is just a collection of records that share the same set of links. It can be inferred that a type has a schema associated with it, but this is not required.
- The specification is concerned with representing the relationship graph between types.
- There is no difference in the structure of a payload based on the request.
- Assume that the application protocol (typically HTTP) controls the semantics of the interaction.


## Reserved Keywords

*This section should be considered as normative.*

All reserved keywords are prefixed with the symbol `@`. Here is an enumeration of all of the reserved keywords:

| Key          | Type       | Description                                     |
|:-------------|:-----------|:------------------------------------------------|
| `@array`     | `Boolean`  | Indicates whether or not a relationship is to many. |
| `@error`     | `Object`   | If a request fails for any reason, it **MUST** return an error. |
| `@href`      | `String`   | An absolute or relative link. |
| `@id`        | `null`, `String`, `[String]` | Each record **MUST** have an ID. |
| `@inverse`   | `null`, `String`   | A link **MUST** define an inverse link if it is bi-directional. |
| `@links`     | `Object`   | Each record **MUST** have this object with at least the `@href` property. It **MUST** also exist at the top level to describe links. |
| `@meta`      | `Object`   | Anything goes here, it's the junk drawer. |
| `@operate`   | `Object`   | Reserved for arbitrary operations to update an record. |
| `@type`      | `String`   | Type of a record. Synonymous with collection. |

The reserved keywords `@id` and `@type` overlap with [JSON-LD](http://www.w3.org/TR/json-ld/), but **MAY** be used interchangeably.


## Payload Structure

*This section should be considered as normative.*

There are certain restrictions on what can exist in the payload in different contexts. Here is an enumeration of restrictions:

- The `@links` and `@meta` object **MUST** only exist at the top-level and per record.
- The top level object **MAY** only contain `@meta`, `@links`, `@error`, or fields keyed by `@type`. Non-reserved fields **SHOULD** be assumed to be types, and **MUST** be valued as arrays of objects. Each non-reserved field **MUST** have a corresponding field in the top-level `@links` object.
- Every record **MUST** contain an `@id` field and a `@links` object. A record's `@links` object **MUST** contain at least a `@href` field to link to the individual record, and optionally contain relationship objects that **MUST** contain at least a `@href` field.
- The top-level `@links` object **MUST** exist and contain fields corresponding to the `@type`s present in the document, and each field **MUST** be valued as an object with at least a `@href` field that refers to the collection of records of that type.
- The `@href` field **MUST** only exist within a `@links` object.
- `@type` and `@array` **MUST** exist on a relationship field object in the top-level `@links` object.
- `@error` object can only exist at the top-level.
- Request payloads are limited to the following reserved keys: `@links` (on records only), `@id`, and `@operate`. All other reserved keys **SHOULD** be ignored.


## Entry Point

This is significant for client discovery, think of it as the home page. At least a top-level `@links` object **MUST** be present.

```http
GET /
```

```json
{
  "@links": {
    "user": {
      "@href": "/users",
      "posts": {
        "@type": "post",
        "@array": true,
        "@inverse": "author"
      }
    },
    "post": {
      "@href": "/posts",
      "author": {
        "@type": "user",
        "@array": false,
        "@inverse": "posts"
      }
    }
  }
}
```

The top-level `@links` in the index is a superset of that which exists in a collection, it **MUST** enumerate all types and each type **MUST** include the `@href` link per collection. Within a type object, fields that are links **MUST** be enumerated. This lays out the relationship graph between types.


## Finding Records

A `GET` request **MAY** be allowed on the collection URI for a particular type.

```http
GET /users?include=posts
```

```json
{
  "@links": {
    "user": {
      "@href": "/users",
      "posts": {
        "@type": "post",
        "@array": true,
        "@inverse": "author"
      }
    },
    "post": {
      "@href": "/posts",
      "author": {
        "@type": "user",
        "@array": false,
        "@inverse": "posts"
      }
    }
  },
  "user": [{
    "@id": "1",
    "name": "Dali Zheng",
    "@links": {
      "@href": "/users/1",
      "posts": {
        "@href": "/users/1/posts",
        "@id": ["1"]
      }
    }
  }],
  "post": [{
    "@id": "1",
    "message": "Micro API is a hypermedia serialization format.",
    "@links": {
      "@href": "/posts/1",
      "author": {
        "@href": "/posts/1/author",
        "@id": "1"
      }
    }
  }]
}
```

Note that the `include` query is not mandated by the specification, it is left to the implementer to decide how to sideload records. Hint: available queries **MAY** be advertised in the `@meta` object.

The `@links` object in a collection **MUST** be a subset of the index `@links` based on the types that are present in the payload, describing links of other types is extraneous and can be ignored. The top-level fields that are not reserved **MUST** correspond to a `@type`, and their values **MUST** be an array of objects, no singular objects are allowed.

There is no concept of primary versus included documents, it is up to the client to consider which records were requested. The field `@href` is a **MUST** in the `@links` object of a record, and in each link object.

An `@array` value that is `true` indicates a to-many association, while a singular value indicates a to-one association. The corresponding `@id`s **MUST** match `@array` value of the top-level `@links`. If `@id` is specified, a null value or empty array indicates that there are no linked records.

Following the `@href` within a `@links` object **MUST** return records corresponding to that field.

```http
GET /users/1/posts
```

```json
{
  "@links": {
    "post": {
      "@href": "/posts",
      "author": {
        "@type": "user",
        "@array": false,
        "@inverse": "posts"
      }
    }
  },
  "post": [{
    "@id": "1",
    "message": "Micro API is a hypermedia serialization format.",
    "@links": {
      "@href": "/posts/1",
      "author": {
        "@href": "/posts/1/author",
        "@id": "1"
      }
    }
  }]
}
```

Note that the top-level `@links` omits the `user` information since it is not required in this context.


## Creating Records

Requesting to create an record **MAY** be allowed at the collection URI for that type.

```http
POST /posts
```

```json
{
  "post": [{
    "message": "Micro API is a hypermedia serialization format.",
    "@links": {
      "author": {
        "@id": "1"
      }
    }
  }]
}
```

An alternative way may be posting to a link URI, in which the server **SHOULD** associate all of the records in the payload to the linked records. For example, here is a request which may be isomorphic to the above example:

```http
POST /users/1/posts
```

```json
{
  "post": [{
    "message": "Micro API is a hypermedia serialization format."
  }]
}
```

It may be helpful for the response to have a `Location` header, but it is not required since the response body may include a link to the created record. The specification is agnostic about whether client side IDs can be specified, so a payload can include `@id`.


## Updating Records

IDs **MUST** be specified in the payload per record to update, and `PATCH` requests can be made wherever the record exists (side-effect of this: IDs cannot be changed, only specified).

```http
PATCH /posts
```

```json
{
  "post": [{
    "@id": "1",
    "message": "I like turtles.",
    "@links": {
      "author": {
        "@id": "1"
      }
    },
    "@operate": {}
  }]
}
```

If the a specified record does not exist at the requested location, it **SHOULD** return an error. The assumption is that *the `PATCH` method replaces the fields specified*. There is a special reserved key `@operate` which allows for arbitrary updates, which this specification is agnostic about. In common update cases, it may be desirable to reject upserts (the `PUT` method defines that [a resource may be created](http://greenbytes.de/tech/webdav/draft-ietf-httpbis-p2-semantics-21.html#PUT)), so `PATCH` is typically what you want to do.

`PATCH` requests can update existing records, however Micro API does not define the semantics to create or delete resources with this method. By setting a link's `@id` property to `null` (for a to-one relationship) or `[]` (empty array for a to-many relationship), it removes the link. It **MUST NOT** be allowed to change any reserved property except for an `@id` within `@links`.


## Deleting Records

```http
DELETE /posts/1
```

A delete request can return no payload (204 No Content) if it succeeds. It can apply to any URI, including collections.

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
    "queriesAllowed": [
      "sort", "limit", "offset", "include", "field", "match"
    ]
  }
}
```

Additional features **MUST** be additive and optional, and can not conflict with the base specification.

Micro API does not restrict arbitrary keys except where it is necessary, such as at the root level and in the `@links` object. For example, an object in the `@links` can embed additional meta-information about the link:

```json
{
  "@links": {
    "order": {
      "customer": {
        "@type": "customer",
        "@array": false,
        "@inverse": "orders"
      }
    }
  },
  "order": [{
    "@id": "1",
    "@links": {
      "@href": "/orders/1",
      "customer": {
        "@href": "/orders/1/customer",
        "@id": "1",
        "timesOrdered": 7,
        "lastShipped": "2015-04-30"
      }
    }
  }]
}
```


## Caveats

Do not use this media type if:

- Your records do not have unique IDs. This shouldn't be too much of a burden.
- Your API requires polymorphic types in links. Micro API does not define the semantics to express this, and is in fact designed to restrict this use case.


## About

Micro API is authored by [Dali Zheng](http://daliwa.li) ([GitHub](https://github.com/daliwali)), and the source for this document is on [GitHub](https://github.com/micro-api/micro-api). It is licensed under the [CC0 1.0 License](https://raw.githubusercontent.com/micro-api/micro-api/master/LICENSE).
