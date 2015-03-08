[![Micro Media Type](https://micro-api.github.io/micro-media-type/media/logo.svg)](https://github.com/micro-api/micro-media-type)

An experimental media type for resilient APIs. The contracts of this media type will *never change*, it is final and not open for debate, only clarification. There are no optional features, everything is required to implement. Its goal is to cover the absolute minimum surface area of a hypermedia API that uses JSON as its format, and nothing more. It does not dictate anything that is external to the media type. The media type is:

```
application/x.micro+json
```

Note that it is unregistered from the [IANA](http://www.internetassignednumbersauthority.org/). Micro media type will remain a defacto standard unless it reaches critical mass. Feel free to use it as the basis for your own unregistered media type.

Micro Media Type draws inspiration from [JSON API](http://jsonapi.org) but is more limited in scope and formal in its restrictions.


## Reserved Keys

All reserved keys are prefixed with `@`. Here is an enumeration of all of the reserved keys:

| Key          | Type       | Description                                     |
|:-------------|:-----------|:------------------------------------------------|
| `@meta`      | `Object`   | Anything goes here, it's the junk drawer. This may only exist at the top level. |
| `@id`        | `null`, `String`, `[String]` | Each entity must have an ID, it may also refer to foreign IDs. |
| `@links`     | `Object`   | Each entity must have this object with at least the `@href` property. It may also exist at the top level to describe links. |
| `@href`      | `String`   | Must be a absolute or relative link.            |
| `@type`      | `String`   | Type of an entity.                              |
| `@array`     | `Boolean`  | Indicates whether or not a link is to many.     |
| `@inverse`   | `String`   | A link must define an inverse link if it is bi-directional. |
| `@error`     | `Object`   | If a request fails for any reason, it must return an error. |
| `@operate`   | `Object`   | Reserved for arbitrary operations to update an entity. |


## Index Payload

This is significant for client discovery, think of it as the home page.

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

The top-level `@links` in the index is a superset of that which exists in a collection, it is keyed by type and each type **MUST** include the `@href` link to the collection. It **MUST** enumerate all types and links. This lays out the relationship graph between types.


## Find Example

```
GET /users/1?include=posts
```

```json
{
  "@meta": {
    "count": 1
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
    "message": "Micro media type is cool.",
    "@links": {
      "@href": "/posts/1",
      "author": {
        "@href": "/posts/1/author",
        "@id": "1"
      }
    }
  }, {
    "@id": "2",
    "message": "Micro media type sucks.",
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

The `@links` object in a collection **MAY** be a subset of the index `@links`. The top-level keys that are not reserved **MUST** be names of types, and their values **MUST** be an array of objects, no singular objects allowed.

Note that in every entity, it is necessary to include backlinks, because bi-directional links are not assumed. Also, the `include` query is not mandated by the specification, it is left to the implementer to decide how to include entities.

An `@id` value that is an array indicates a to-many association, while a singular value indicates a to-one association. A null value or empty array indicates no link, and it is optional to include.

```
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
    "message": "Micro media type is cool.",
    "@links": {
      "@href": "/posts/1",
      "author": {
        "@href": "/posts/1/author",
        "@id": "1"
      }
    }
  }, {
    "@id": "2",
    "message": "Micro media type sucks.",
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

```
POST /users/1/posts
```

```json
{
  "post": [{
    "message": "Wait, isn't Micro Media Type a rip-off of JSON API?"
  }]
}
```

By posting to the related URL, the server **MUST** associate all of the posts to the user. An alternative and more flexible way of doing the same thing:

```
POST /posts
```

```json
{
  "post": [{
    "message": "Wait, isn't Micro Media Type a rip-off of JSON API?",
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

Either way is fine and allowed. The response **MUST** include the created entities, no empty response is allowed. The specification is agnostic about whether client side IDs may be specified.


## Update Example

```
PATCH /posts
```

```json
{
  "post": [{
    "@id": "1",
    "message": "I like APIs."
  }, {
    "@id": "2",
    "message": "Micro media type is an original work.",
    "@operate": { ... }
  }]
}
```

IDs **MUST** be specified per entity to patch, and patch requests may be made to the collection URL (side-effect of this: IDs cannot be changed, only specified). The assumption is that patch replaces the fields specified. There is a special reserved key `@operate` which allows for arbitrary updates, which this specification is agnostic about. The `PUT` method is highly discouraged and actually a `PUT` request should *overwrite* the entire entity, so in the vast majority of cases, `PATCH` is actually what you want to do.

Patch requests can only update existing entities, it may not create or delete. By setting a link's `@id` property to `null` (for a to-one relationship) or `[]` (empty array for a to-many relationship), it removes the link.


## Delete Example

```
DELETE /posts/2
```

A delete request **MUST** return no payload if it succeeds, and applies to any accessible URL, including collections. Pretty simple.

```
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

- Your API requires polymorphism. Micro media type strictly disallows this.
- Your entities do not have unique IDs. This shouldn't be too much of a burden.


## Suggestions on Implementation

Feel free to ignore this section, it is only meant to provide hints on how one might implement common features. Micro media type does not dictate anything about pagination, filtering, limiting fields, because that is outside of its scope as a media type. The `@meta` object may contain hints on what queries may be appended to GET requests, such as filtering, pagination, fields, etc.

There should be no negotiation of extensions, additional features must be additive and optional.
