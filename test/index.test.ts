/* eslint-env jest */

import Bluebird = require('bluebird')
import thing = require('../src/index')

describe('src/index', () => {
  it('accepts an object of key/value pairs describing services', () => {
    const result = thing.configureMiddleware({
      services: {
        mysql: () => Bluebird.resolve({ status: thing.ServiceState.OK })
      }
    })
    expect(result.overallStatus).toEqual(thing.ServiceState.OK)
    expect(result.services.mysql).toEqual({ status: thing.ServiceState.OK })
  })
})
