[![Micro API](https://micro-api.github.io/micro-api/assets/logo.svg)](http://micro-api.org)

Micro API is a media type for self-documenting APIs on the web using hypermedia and linked data. It consists of a *strict* subset of [JSON-LD](http://json-ld.org), a vocabulary, and semantics for [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) operations. As the name implies, it is intended to be very concise and therefore easy to implement. Its registered media type is:

```yaml
Content-Type: application/vnd.micro+json
```

The current published version is **2016-09-06**, and the media type is [registered](https://www.iana.org/assignments/media-types/application/vnd.micro+json) with the [IANA](http://www.iana.org/).


## Introduction

Micro API simplifies [JSON-LD](http://json-ld.org) by limiting it to a subset which can be traversed reliably without using processing algorithms. It also provides a minimal vocabulary for basic fields. Example payloads and HTTP requests should be considered non-normative.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification have the meaning defined in [RFC 2119](https://www.ietf.org/rfc/rfc2119).


## Vocabulary

*This section should be considered normative.*

There are two categories of the vocabulary. First, there are the generic field definitions.

| Property | Type | Description |
|:---------|:-----|:------------|
| [`id`](http://micro-api.org/id) | `String`, `Number` | A unique value used for identifying resources. |
| [`meta`](http://micro-api.org/meta) | `Object` | Any meta-information may be contained here. |
| [`query`](http://micro-api.org/query) | `Object` | A container for showing information about the current query. |
| [`operate`](http://micro-api.org/operate) | `Object` | Reserved for arbitrary operations to update resources. |
| [`error`](http://micro-api.org/error) | `Object` | If a request fails for any reason, it **SHOULD** return an error. |

Second, there are meta-vocabulary fields used for describing the ontology of an API.

| Property | Type | Description |
|:---------|:-----|:------------|
| [`vocab`](http://micro-api.org/vocab) | `Object` | An enumeration of classes and properties. |
| [`description`](http://micro-api.org/description) | `String` | Descriptions for classes and properties. |
| [`belongsTo`](http://micro-api.org/belongsTo) | `String` | An enumeration of types which a property belongs to, including the built-in field definitions `meta`, `query`, `operate`, `error`. |
| [`inverse`](http://micro-api.org/inverse) | `String` | An inversely related property for a relationship. |
| [`isArray`](http://micro-api.org/isArray) | `Boolean` | For properties, indicates if their values are arrays. Defaults to false. |
| [`Type`](http://micro-api.org/Type) | `Type` | A type defines any data structure which contains the same set of properties. |
| [`String`](http://micro-api.org/String) | `Type` | An UTF-8 string. |
| [`Number`](http://micro-api.org/Number) | `Type` | An IEEE 754 floating point number. |
| [`Boolean`](http://micro-api.org/Boolean) | `Type` | A boolean value. |
| [`Date`](http://micro-api.org/Date) | `Type` | An ISO 8601 date. |
| [`Buffer`](http://micro-api.org/Buffer) | `Type` | A base64-encoded buffer. |
| [`Object`](http://micro-api.org/Object) | `Type` | An object, or arbitrary data structure. |


## Payload Restrictions

*This section should be considered normative.*

In general, the payload should look like the flattened form of JSON-LD, with some additional restrictions:

- The root node **MUST** be a singular object.
- There **MUST** be a top-level `@context` object, containing at least the exact key-value pair: `{ "µ": "http://micro-api.org/" }`.
- Resources **MUST** contain a unique `@id` *and* `µ:id`, no blank nodes are allowed. The `@id` is an IRI, which is not to be confused with `µ:id` which is an application-specific identifier.
- Resources **MUST** be represented as an array via the default `@graph`.
- References **MUST** be represented as a singular object with either the `@id` property *and/or* the `µ:id` property.
- The `@reverse` property **MUST** only exist adjacent to an `µ:id` property. This property is useful for expressing inverse relationships without naming them.

The entirety of Micro API can be expressed using only a few reserved keywords from JSON-LD: `@context`, `@vocab`, `@base`, `@graph`, `@type`, `@id`, and `@reverse`.


## Entry Point

The expectation of a Micro API entry point is to enumerate types and properties and provide links to collections. It **MUST** contain the `µ:vocab` property, valued as an array of objects.

```http
GET /
```

```json
{
  "@context": {
    "@vocab": "/#",
    "µ": "http://micro-api.org/"
  },
  "µ:vocab": [
    { "@id": "name", "@type": "µ:String",
      "µ:belongsTo": [ "Person", "Movie" ] },
    { "@id": "actor", "@type": "Person",
      "µ:belongsTo": [ "Movie" ], "µ:isArray": true },
    { "@id": "Person", "@type": "µ:Type",
      "µ:description": "A human being." },
    { "@id": "Movie", "@type": "µ:Type",
      "µ:description": "A moving picture." }
  ],
  "Person": { "@id": "/people" },
  "Movie": { "@id": "/movies" }
}
```

The `@vocab` field of a Micro API **MUST** be the path to the API suffixed with the `#` character, so that dereferencing always refers to the entry point.


## Finding Resources

A `GET` request **MAY** be allowed on the collection IRI for a particular type.

```http
GET /movies
```

```json
{
  "@context": {
    "@vocab": "/#",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Movie",
    "@id": "/movies/1",
    "µ:id": 1,
    "name": "The Matrix",
    "actor": {
      "@id": "/movies/1/actors",
      "µ:id": [ 1, 2, 3 ]
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
    "@vocab": "/#",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Person",
    "@id": "/people/1",
    "µ:id": 1,
    "name": "Keanu Reeves",
    "@reverse": {
      "actor": {
        "@id": "/people/1/acted-in",
        "µ:id": [ 1 ]
      }
    }
  } ]
}
```


## Creating Resources

Requesting to create an resource **MAY** be allowed at the collection IRI for that type. The payload **MUST** be a valid Micro API document, and referenced IDs must be specified using the `id` property.

```http
POST /people
```

```json
{
  "@context": {
    "@vocab": "/#",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Person",
    "name": "John Doe",
    "@reverse": {
      "actor": {
        "µ:id": [ "memento" ]
      }
    }
  } ]
}
```

It may be helpful for the response to have a `Location` header, but it is not required since the response body may include a link to the created resource.


## Updating Resources

IDs **MUST** be specified in the payload per resource to update, and `PATCH` requests can be made wherever the resource exists (*corollary*: IDs can not be changed, only specified).

```http
PATCH /people
```

```json
{
  "@context": {
    "@vocab": "/#",
    "µ": "http://micro-api.org/"
  },
  "@graph": [ {
    "@type": "Person",
    "µ:id": "john-doe",
    "name": "Johnny Doe",
    "actor": {
      "µ:id": [ "point-break" ]
    },
    "µ:operate": {}
  } ]
}
```

If the a specified resource does not exist at the requested location, it **SHOULD** return an error. The assumption is that *the `PATCH` method replaces the fields specified*. There is a special `µ:operate` property which allows for arbitrary updates, which this specification is agnostic about. In common update cases, it may be desirable to reject upserts (the `PUT` method defines that [a resource may be created](http://greenbytes.de/tech/webdav/draft-ietf-httpbis-p2-semantics-21.html#PUT)), so `PATCH` is typically what you want to do.

`PATCH` requests can update existing resources, however Micro API does not define the semantics to create or delete resources with this method. In this example, by setting a link's `µ:id` property to `null` (for a to-one relationship) or `[]` (empty array for a to-many relationship), it removes the link.


## Deleting Resources

```http
DELETE /people/john-doe
```

A delete request can return no payload (HTTP 204 No Content) if it succeeds. It can apply to any IRI, including collections.

```http
DELETE /people/john-doe/children
```

In this example, the request means delete all of the resources at this IRI, not just the link. There is no concept of relationship entities.


## Error Response

If a request fails for any reason, it **MUST** return a `µ:error` object. The contents of the error object are opaque to this specification.

```json
{
  "@context": {
    "@vocab": "/#",
    "µ": "http://micro-api.org/"
  },
  "µ:error": {
    "name": "NotFoundError",
    "description": "The requested resource was not found."
  }
}
```


## Querying

Micro API does not specify anything about pagination, filtering, sparse fields, sorting, etc. For example, the `µ:query` object **MAY** contain hints on what queries can be appended to GET requests, with further information about the query provided by a vocabulary (optional):

```json
{
  "@context": {
    "@vocab": "/#",
    "µ": "http://micro-api.org/"
  },
  "µ:query": {
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


## Unregistered Media Type

One may use [MessagePack](http://msgpack.org) instead of JSON as the serialization format for greater bandwidth savings. Since MessagePack is an unregistered media type, the corresponding Micro API media type may be unregistered as well:

```yaml
Content-Type: application/x-micro-api
```

It is completely optional to support this unregistered media type, but it should be interpreted as Micro API with MessagePack enabled.


## Prior Art

Micro API builds upon [JSON-LD](https://www.w3.org/TR/json-ld/), which is a W3C recommendation. A JSON-based serialization format has the advantage of widespread tooling and developer understanding.

In contrast to [Linked Data Platform](https://www.w3.org/TR/ldp/), it does not use the Turtle format, which is useful only for working within [RDF](https://www.w3.org/RDF/). It also lacks a concept of "containers", which assumes that relationships are hierarchical. What is similar is that both stipulate which actions may be taken on resources.

Micro API is an alternative for [Hydra](http://www.markus-lanthaler.com/hydra/), another specification for Web APIs. It is much less prescriptive than Hydra, and is implicit in cases which Hydra is more explicit. For example, some differences are:

- **Collection**: all resources are collections.
- **Operation**: these are assumed to match HTTP semantics. Only `PATCH` requests may have special application-specific operations, using `µ:operate`.
- **Templated link**: clients must follow server links and only queries are allowed.
- **API Documentation**: this is expected to contain natural language.

A key difference between Micro API and Hydra is that Micro API **does not** assume that documentation is machine-processable. Why this matters is that natural language may be the only way to express complicated application logic. For example, Hydra stipulates that properties can be required, readable, or writable, but does not specify under what conditions a property may be required, readable, or writable. Is it required on create but not update? Readable to some clients but not others? The possibilities are endless.


## About

The source for this document is on [GitHub](https://github.com/micro-api/micro-api). It is licensed under the [CC0 1.0 License](https://raw.githubusercontent.com/micro-api/micro-api/master/LICENSE).
