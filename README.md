[![Micro API](https://micro-api.github.io/micro-api/assets/logo.svg)](http://micro-api.org)

Micro API is a media type for web APIs using hypermedia. The specification covers basic requirements of a hypermedia API that uses JSON as its format, and nothing more.

```
Content-Type: application/vnd.micro+json
```

The media type is [registered](http://www.iana.org/assignments/media-types) with the [IANA](http://www.iana.org/).


## Introduction

Micro API is mostly concerned with the structure of the payload, and does not dictate how the server should implement HTTP. Concepts relevant to APIs such as querying, operational transforms, schemas, and linked data are opaque to this specification. The contracts of this media type are designed to *never change*, it is considered final and only open for clarification.

Micro API draws some inspiration from [JSON API](http://jsonapi.org) but is more limited in scope and generally more permissive. The base specification's [H-Factor](http://amundsen.com/hypermedia/hfactor/) supports LE, LO, LN, LI, but could support all of the H-Factors by extending the base specification. It should follow [Roy Fielding's definition of REST](http://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven) as closely as possible.


## Reading this Document

Micro API extends the generic JSON media type, defined in [RFC 4627](https://www.ietf.org/rfc/rfc4627).

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification have the meaning defined in [RFC 2119](https://www.ietf.org/rfc/rfc2119).


## Key Concepts

- All records **MUST** uniquely identified by `@id` and `@type`.
- A type is just a collection of records that share the same set of `@links`. It can be inferred that a type has a schema associated with it, but this is not required.
- All types have links to collection endpoints which requests can be made to.
- The relationship graph is entirely defined in the entry point and subsets of it can appear in other entities.
- Inverse links **SHOULD** be assumed to make reciprocal updates on linked records.
- There is no distinction between a relationship and an entity, so for example a `DELETE` request on a `@href` within a `@links` object **SHOULD** actually delete the record and not just remove the relationship.
- There is no difference in the structure of a payload based on the request method, it is consistent.
- Assume that the network protocol controls the semantics of common actions on URIs. For example, Micro API over HTTP **SHOULD** assume that `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` work as expected.


## Reserved Keywords

All reserved keywords are prefixed with a `@` symbol. Here is an enumeration of all of the reserved keywords, which are considered normative:

| Key          | Type       | Description                                     |
|:-------------|:-----------|:------------------------------------------------|
| `@array`     | `Boolean`  | Indicates whether or not a relationship is to many. |
| `@error`     | `Object`   | If a request fails for any reason, it **MUST** return an error. |
| `@href`      | `String`   | An absolute or relative link. |
| `@id`        | `null`, `String`, `[String]` | Each record **MUST** have an ID, it **MAY** also refer to foreign IDs. |
| `@inverse`   | `null`, `String`   | A link **MUST** define an inverse link if it is bi-directional. |
| `@links`     | `Object`   | Each record **MUST** have this object with at least the `@href` property. It **MUST** also exist at the top level to describe links. |
| `@meta`      | `Object`   | Anything goes here, it's the junk drawer. This **MAY** exist at either the top level or per record. |
| `@operate`   | `Object`   | Reserved for arbitrary operations to update an record. |
| `@type`      | `String`   | Type of a record. Synonymous with collection. |

The reserved keywords `@id` and `@type` overlap with [JSON-LD](http://www.w3.org/TR/json-ld/), but **MAY** be used interchangeably.


## Payload Structure

There are certain restrictions on what can exist in the payload in different contexts. Here is an enumeration of restrictions, which are considered normative:

- The top-level JSON object **MUST** be singular, not an array.
- The `@links` and `@meta` object **MUST** only exist at the top-level and per record.
- The top level object **MUST** only contain `@meta`, `@links`, or fields keyed by `@type`. Non-reserved fields **SHOULD** be assumed to be types, and **MUST** be valued as arrays of objects. Each non-reserved field **MUST** have a corresponding field in the top-level `@links` object.
- Every record **MUST** contain an `@id` field and a `@links` object. A record's `@links` object **MUST** contain at least a `@href` field to link to the individual record, and optionally contain relationship objects that **MUST** contain at least `@href` and `@id` fields.
- The top-level `@links` object **MUST** exist and **MUST** only contain fields corresponding to a `@type`, and each field **MUST** be valued as an object with at least a `@href` field that refers to the collection of records of that type.
- The `@href` field **MUST** only exist within a `@links` object.
- `@array`, `@type`, and `@inverse` **MUST** exist on a relationship field object in the top-level `@links` object.
- `@error` object can only exist at the top-level and other fields **SHOULD NOT** exist at the top-level when it is present.
- Request payloads are limited to the following reserved keys: `@links` (on records only), `@id`, and `@operate`. All other reserved keys **SHOULD** be ignored.
- `@operate` can only exist per record in a request payload to update a record.


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

Note that the `include` query is not mandated by the specification, it is left to the implementer to decide how to sideload records. Hint: available queries **MAY** be advertised in the `@meta` object.

```http
GET /users/1?include=posts
```

```json
{
  "@meta": {
    "count": 3
  },
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
        "@id": ["1", "2"]
      }
    }
  }],
  "post": [{
    "@id": "1",
    "message": "Micro API is a pretty minimal hypermedia format.",
    "@links": {
      "@href": "/posts/1",
      "author": {
        "@href": "/posts/1/author",
        "@id": "1"
      }
    }
  }, {
    "@id": "2",
    "message": "Micro API is quite small.",
    "@links": {
      "@href": "/posts/2",
      "author": {
        "@href": "/posts/2/author",
        "@id": "1"
      }
    }
  }]
}
```

The `@links` object in a collection **MUST** be a subset of the index `@links` based on the types that are present in the payload, describing links of other types is extraneous and can be ignored. The top-level fields that are not reserved **MUST** correspond to a `@type`, and their values **MUST** be an array of objects, no singular objects are allowed.

There is no concept of primary versus included documents, it is up to the client to consider which records were requested. The fields `@href` and `@id` are a **MUST** in the `@links` object of a record.

An `@array` value that is `true` indicates a to-many association, while a singular value indicates a to-one association. The corresponding `@id`s **MUST** match `@array` value of the top-level `@links`. A null value or empty array indicates no link, and it is a **MUST** to include.

Following the `@href` within a `@links` object **MUST** return records corresponding to that field.

```http
GET /users/1/posts
```

```json
{
  "@meta": {
    "count": 2
  },
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
    "message": "Micro API is cool.",
    "@links": {
      "@href": "/posts/1",
      "author": {
        "@href": "/posts/1/author",
        "@id": "1"
      }
    }
  }, {
    "@id": "2",
    "message": "I like turtles.",
    "@links": {
      "@href": "/posts/2",
      "author": {
        "@href": "/posts/2/author",
        "@id": "1"
      }
    }
  }]
}
```

Note that the top-level `@links` omits the `user` information since it is not required in this context.


## Creating Records

Requesting to create an record **MAY** be allowed at wherever URI that type exists.

```http
POST /users/1/posts
```

```json
{
  "post": [{
    "message": "Micro API is best type."
  }]
}
```

By posting to a link URI, the server **SHOULD** associate all of the records in the payload to the linked records, but the payload takes precedence over the URI, so that if an `author` is specified in the payload, that has priority. An alternative and more flexible way of doing the same thing:

```http
POST /posts
```

```json
{
  "post": [{
    "message": "Micro API is best type.",
    "@links": {
      "author": {
        "@id": "1"
      }
    }
  }, {
    "message": "This post is not linked to an author."
  }]
}
```

Either way is fine and allowed. The response **SHOULD** include the created records with a `Location` header to be helpful to the client. The specification is agnostic about whether client side IDs can be specified, so a payload can include `@id`.


## Updating Records

```http
PATCH /posts
```

```json
{
  "post": [{
    "@id": "1",
    "message": "I like APIs.",
    "@links": {
      "author": {
        "@id": "2"
      }
    }
  }, {
    "@id": "2",
    "message": "Micro API just works.",
    "@operate": {}
  }]
}
```

IDs **MUST** be specified per record to patch, and patch requests can be made wherever the record exists (side-effect of this: IDs cannot be changed, only specified). If the a specified record does not exist at the requested location, it **SHOULD** return an error. The assumption is that *patch replaces the fields specified*. There is a special reserved key `@operate` which allows for arbitrary updates, which this specification is agnostic about. The `PUT` method is highly discouraged and actually a `PUT` request *overwrites* the entire record, so in the vast majority of cases, `PATCH` is actually what you want to do.

`PATCH` requests can update existing records, however Micro API does not define the semantics to create or delete with this method. By setting a link's `@id` property to `null` (for a to-one relationship) or `[]` (empty array for a to-many relationship), it removes the link. It **MUST NOT** be allowed to change any reserved property except for an `@id` within `@links`, but the `@operate` property can be used freely.


## Deleting Records

```http
DELETE /posts/2
```

A delete request **MUST** return no payload if it succeeds, and applies to any accessible URI, including collections. Pretty simple.

```http
DELETE /users/1/posts
```

This **MUST** actually delete all of a users' posts, not just the link. There is no concept of relationship entities.


## Error Payload

If a request fails for any reason, it **MUST** return a single `@error` object. The contents of the error object are opaque to this specification.

```json
{
  "@error": {
    "title": "NotFoundError",
    "message": "The requested record was not found."
  }
}
```


## Extending

Micro API does not dictate anything about pagination, filtering, limiting fields, or sorting, since these are extraneous concerns. The `@meta` object **MAY** contain hints on what queries can be appended to GET requests. For example:

```json
{
  "@meta": {
    "user": {
      "limit": 1000,
      "offset": 0,
      "sort": {
        "name": 1
      },
      "fields": ["author"],
      "match": {
        "name": "Dali Zheng"
      }
    }
  }
}
```

Additional features **MUST** be additive and optional, and can not conflict with the base specification. If there are versioning concerns with the implementation, this can be signalled via parameters of the `Content-Type` header, such as `application/vnd.micro+json; version=1.0`, where `version` does not specify the version of this specification but rather that of the implementation. Versioning is [highly discouraged](https://twitter.com/fielding/status/376835835670167552).

Extensions of the base specification is considered out-of-band information, and Micro API is agnostic about negotiation of extensions. Generally, extensions can be advertised by the server so that clients can discover them. Micro API does not try to restrict arbitrary keys except where it may be necessary, such as at the top level and in the `@links` object. For example, a relationship object **MAY** embed additional meta-information about the relationship:

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
        "orderedAt": "2015-03-29",
        "shippedAt": "2015-03-30"
      }
    }
  }]
}
```


## Caveats

Do not use this media type if:

- Your API requires polymorphic types in relationships. Micro API does not define the semantics to express this.
- Your records do not have unique IDs. This shouldn't be too much of a burden.


## About

Micro API is authored by [Dali Zheng](http://daliwa.li) ([GitHub](https://github.com/daliwali)), and the source for this document is on [GitHub](https://github.com/micro-api/micro-api). It is licensed under the [CC0 1.0 License](https://raw.githubusercontent.com/micro-api/micro-api/master/LICENSE).
