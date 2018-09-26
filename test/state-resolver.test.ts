/* eslint-env jest */

import Bluebird = require('bluebird')
import stateResolver = require('../src/state-resolver')

describe('src/state-resolver', () => {
  describe('src/configureMiddleware', () => {
    it('accepts an object of key/value pairs describing services', () =>
      stateResolver
        .configureMiddleware({
          services: {
            mysql: Bluebird.resolve({ status: stateResolver.ServiceState.OK })
          }
        })
        .then((result: stateResolver.IServiceResult) => {
          expect(result.overallStatus).toEqual(stateResolver.ServiceState.OK)
          expect(result.services.mysql).toEqual({
            status: stateResolver.ServiceState.OK
          })
        }))
  })
})
