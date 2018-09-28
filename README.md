# A Few Good Deps

> You can't handle the truth!

## Description and Rationale

This package provides a drop-in set of functions that provide your production-ready Kuali app
with some much needed uptime integrity checking of dependent services. This endpoint will be checked
by upstream uptime integrity tools managed by the ops team. The data will eventually be available
to see our uptime metrics.

What's a dependent service? Any major technology or backend that your app relies on to function
correctly. Think databases, caches, hardware limits (e.g. disk or memory), and even potentially
other application services (e.g. core auth, s3, etc). Be careful pinging other services though,
you may just end up causing a cascading failure across all kuali products if not done carefully.

The heart of this package is the `createHealthCheck` function which accepts two arguments:

* Your express app, ready for some `use`ing.
* A map of services you wish to report on. The services should be keyed by a string of your choosing
  with the value being a function taking the request and response, and whose result is a promise
  which should return a service status object. Checkout [src/status.ts](src/status.ts) for type
  signatures, or better yet just use the built-in status returning functions: `status.ok`,
  `status.warn`, or `status.error`. Each can take an optional string message which will be
  available in any downtime notifications helping us get to the root of the problem quicker.

## Documentation

Read the [integrity health check specification](https://wiki.kuali.co/dev/integrity_health_check)
to learn more.

## Installation

```shell
yarn add @kuali/a-few-good-deps
```

## Usage

```javascript
const express = require('express')
const { createHealthCheck, status } = require('@kuali/a-few-good-deps')
const Sequelize = require('sequelize')

const verifyMysqlIntegrity = (req, res) =>
  Promise.resolve(new Sequelize(...connectionParams))
    .then(connection => connection.query('SELECT count(id) FROM mytable'))
    .then(result => {
      if (result.count <= 0) {
        // Report a potential issue with MySQL
        return status.warn("Expected some rows but didn't get any")
      }

      // Report that everything with MySQL is OK
      return status.ok()
    })
    .catch(error => status.error(error.message)) // Report MySQL is down

const app = express()

// The following function will register a GET endpoint at /health/integrity which returns a JSON
// response corresponding to the payload Schema described in the linked documentation.
createHealthCheck(app, {
  mysql: verifyMysqlIntegrity
  // ... add any other checks you want
})
```

Or use async/await if that's your preference:

```javascript
const express = require('express')
const { createHealthCheck, report } = require('@kuali/a-few-good-deps')
const Sequelize = require('sequelize')

const verifyMysqlIntegrity = async (req, res) => {
  const connection = new Sequelize(...connectionParams))
  try {
    const result = await connection.query('SELECT count(id) FROM mytable'))
    if (result.count <= 0) {
      // Report a potential issue with MySQL
      return status.warn("Expected some rows but didn't get any")
    }

    // Report that everything with MySQL is OK
    return status.ok()
  } catch (error) {
    return status.error(error.message)) // Report MySQL is down
  }
}

const app = express()

// The following function will register a GET endpoint at /health/integrity which returns a JSON
// response corresponding to the payload Schema described in the linked documentation.
createHealthCheck(app, {
  mysql: verifyMysqlIntegrity
  // ... add any other checks you want
})
```

You can also pass a set of middleware to invoke before handling the request.

```javascript
// ...

const getMysqlConnection = (req, res, next) => {
  res.locals.mysqlConnection = buildConnectionForRequest(req)
  next()
}

const services = {
  mysql: (req, res) =>
    res.locals.mysqlConnection
      .query('SELECT count(id) FROM mytable')
      .then(result => status.ok('looking good'))
}

const options = {
  middleware: [getMysqlConnection /* ... */]
}

createHealthCheck(app, services, options)

// ...
```
