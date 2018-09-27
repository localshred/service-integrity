# A Few Good Deps

> You can't handle the truth!

## Description and Rationale

This package provides a drop-in set of functions that provide your production-ready Kuali app
with some much needed uptime integrity checking of dependent services. This endpoint will be checked by upstream uptime integrity tools managed by the ops team. The data will eventually be available to see our uptime metrics.

What's a dependent service? Any major technology or backend that your app relies on to function correctly. Think databases, caches, hardware limits (e.g. disk or memory), and even potentially other application services (e.g. core auth, s3, etc). Be careful pinging other services though, you may just end up causing a cascading failure across all kuali products if not done carefully.

The heart of this package is the `createHealthCheck` function which accepts two arguments:

* Your express app, ready for some `use`ing.
* A map of services you wish to report on. The services should be keyed by a string of your choosing with the value being a resolvable promise which should return a service status object. Checkout `src/status.ts` for type signatures, or better yet just use the built-in status returning functions: `ok`, `warn`, or `error`. Each can take an optional string message which will be available in any downtime notifications helping us get to the root of the problem quicker.

## Documentation

Read the [integrity health check specification](https://wiki.kuali.co/dev/integrity_health_check) to learn more.

## Installation

```shell
yarn add @kuali/a-few-good-deps
```

## Usage

```javascript
const express = require('express')
const { createHealthCheck, ok, warn, error } = require('a-few-good-deps')
const Sequelize = require('sequelize')

const verifyMysqlIntegrity = () =>
  Promise.resolve(new Sequelize(...connectionParams))
    .then(sequelize => sequelize.query("SELECT count(id) FROM mytable"))
    .then(result => {
      if (result.count > 0) {
        return ok() // Report that everything with MySQL is OK
      }
      return warn("Expected some rows but didn't get any") // Report a potential issue with MySQL
    })
    .catch(e => error(e.message)) // Report MySQL is down

const app = express()

// The following function will register a GET endpoint at /health/integrity which returns a JSON
// response corresponding to the payload Schema described in the linked documentation.
createHealthCheck(app, {
  mysql: verifyMysqlIntegrity(),
  // ... add any other checks you want
})
```
