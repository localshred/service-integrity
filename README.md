# A Few Good Deps

> You can't handle the truth!

This package provides a drop-in set of functions that provide your production-ready Kuali app
with some much needed integrity health checking.

## Documentation

Read the [specification](https://wiki.kuali.co/dev/integrity_health_check) to learn more.

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
