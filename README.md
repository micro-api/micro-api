[![Micro API](https://micro-api.github.io/micro-api/assets/logo.svg)](http://micro-api.org)

A media type for resilient web APIs using hypermedia. Its goal is to cover the absolute minimum surface area of a hypermedia API that uses JSON as its format, and nothing more. The contracts of this media type will *never change*, it is final and not open for debate, only clarification. There are no optional features, everything is required to implement. The media type is:

```
application/vnd.micro+json
```

The media type proposal is currently pending from the [IANA](http://www.internetassignednumbersauthority.org/).


## Motivation and Purpose

There are many media types for hypermedia, but Micro API aims to limit its scope close to a minimum for implementing an API. Micro API is mostly concerned with the payload, and does not dictate how the server should implement HTTP. Other concepts such as querying, operational transforms, schemas, and linked data are opaque to this specification.

Micro API draws inspiration from [JSON API](http://jsonapi.org) but is more limited in scope and formal in its restrictions. Its [H-Factor](http://amundsen.com/hypermedia/hfactor/) supports LE, LO, LN, LI in the base specification, but could support all of the H-Factors by extending the base specification.

It should be assumed that the network protocol should facilitate common actions on URIs. For example, Micro API over HTTP should assume that `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` work as they should.


## Reserved Keys

All reserved keys are prefixed with a `@` symbol. Here is an enumeration of all of the reserved keys:

| Key          | Type       | Description                                     |
|:-------------|:-----------|:------------------------------------------------|
| `@array`     | `Boolean`  | Indicates whether or not a link is to many.     |
| `@error`     | `Object`   | If a request fails for any reason, it must return an error. |
| `@href`      | `String`   | Must be a absolute or relative link.            |
| `@id`        | `null`, `String`, `[String]` | Each entity must have an ID, it may also refer to foreign IDs. |
| `@inverse`   | `String`   | A link must define an inverse link if it is bi-directional. Optional but recommended to use. |
| `@links`     | `Object`   | Each entity must have this object with at least the `@href` property. It may also exist at the top level to describe links. |
| `@meta`      | `Object`   | Anything goes here, it's the junk drawer. This may only exist at the top level. |
| `@operate`   | `Object`   | Reserved for arbitrary operations to update an entity. |
| `@type`      | `String`   | Type of an entity.                              |

The reserved keys `@id` and `@type` overlap with [JSON-LD](http://www.w3.org/TR/json-ld/), but may be used interchangeably.


## Entry Point

This is significant for client discovery, think of it as the home page. At least a top-level `@links` object should be present.

```http
GET /
```

```json
{
  "@links": {
    "@href": "/",
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

The top-level `@links` in the index is a superset of that which exists in a collection, it **MUST** enumerate all types and each type **MUST** include the `@href` link per collection, and a `@href` to the current document. Within a type object, fields that are links **MUST** be enumerated. This lays out the relationship graph between types.


## Find Example

Note that the `include` query is not mandated by the specification, it is left to the implementer to decide how to sideload entities. Hint: available queries may be advertised in the `@meta` object.

```http
GET /users/1?include=posts
```

```json
{
  "@meta": {
    "count": 3
  },
  "@links": {
    "@href": "/users/1",
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

The `@links` object in a collection **MUST** be a subset of the index `@links` based on the types that are present in the payload, describing links of other types is extraneous and should be ignored. The top-level keys that are not reserved **MUST** be names of types, and their values **MUST** be an array of objects, no singular objects are allowed.

There is no concept of primary versus included documents, it is up to the client to consider which entities were requested. The keys `@href` and `@id` are a **MUST** in the `@links` object of an entity.

An `@array` value that is `true` indicates a to-many association, while a singular value indicates a to-one association. The corresponding `@id`s must match `@array` value of the top-level `@links`. A null value or empty array indicates no link, and it is a **MUST** to include.

Following the `@href` within a `@links` object **MUST** return entities corresponding to that field, and its payload **MUST** contain all of the `@id`s or else it should return an error.

```http
GET /users/1/posts
```

```json
{
  "@meta": {
    "count": 2
  },
  "@links": {
    "@href": "/users/1/posts",
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


## Create Example

Requesting to create an entity may be allowed at wherever URI that type exists.

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

By posting to a link URI, the server should associate all of the entities in the payload to the linked entities, but the payload takes precedence over the URI, so that if an `author` is specified in the payload, that should be considered. An alternative and more flexible way of doing the same thing:

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

Either way is fine and allowed. The response should include the created entities with a `Location` header to be helpful to the client. The specification is agnostic about whether client side IDs may be specified, so a payload may include `@id`.


## Update Example

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

IDs **MUST** be specified per entity to patch, and patch requests may be made wherever the entity may exist (side-effect of this: IDs cannot be changed, only specified). If the a specified entity does not exist at the requested location, it should return an error. The assumption is that *patch replaces the fields specified*. There is a special reserved key `@operate` which allows for arbitrary updates, which this specification is agnostic about. The `PUT` method is highly discouraged and actually a `PUT` request should *overwrite* the entire entity, so in the vast majority of cases, `PATCH` is actually what you want to do.

Patch requests can only update existing entities, it may not create or delete. By setting a link's `@id` property to `null` (for a to-one relationship) or `[]` (empty array for a to-many relationship), it removes the link. It is **NOT** allowed to change any reserved property except for an `@id` within `@links`, but the `@operate` property may be used freely.


## Delete Example

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
    "message": "The requested entity was not found."
  }
}
```


## Caveats

Do not use this media type if:

- Your API requires polymorphic relationships. Micro API strictly disallows this.
- Your entities do not have unique IDs. This shouldn't be too much of a burden.


## Suggestions on Implementation

Feel free to ignore this section, it is only meant to provide hints on how one might implement common features. Micro API does not dictate anything about pagination, filtering, limiting fields, or sorting, since these are extraneous concerns to hypermedia. The `@meta` object may contain hints on what queries may be appended to GET requests, such as filtering, pagination, fields, sorting, etc. For example:

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

There should be no negotiation of extensions, additional features must be additive and optional. If there are implementation specific details outside the scope of this specification that are required to function, this can be signalled via parameters of the `Content-Type` header, such as `application/vnd.micro+json; version=1.0`, where `version` does not specify the version of this specification but rather that of the implementation.


## About

Micro API is authored by [Dali Zheng](http://daliwa.li) ([GitHub](https://github.com/daliwali)), and it is licensed under the [CC0 1.0 License](https://raw.githubusercontent.com/micro-api/micro-api/master/LICENSE).
