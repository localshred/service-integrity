/* eslint-env jest */

import Bluebird = require('bluebird')
import stateResolver = require('../src/state-resolver')
import { ServiceState } from '../src/status'

const { configureMiddleware } = stateResolver

describe('src/state-resolver', () => {
  describe('src/configureMiddleware', () => {
    it('resolves all services and produces an overallStatus', () =>
      configureMiddleware({
        services: {
          mysql: Bluebird.resolve({ status: 'OK' as ServiceState })
        }
      }).then((result: stateResolver.IServiceResult): void => {
        expect(result.overallStatus).toEqual('OK')
        expect(result.services.mysql).toEqual({ status: 'OK' as ServiceState })
      }))

    it('returns a warning if at least one service is in the WARN state', () =>
      configureMiddleware({
        services: {
          elasticsearch: Bluebird.resolve({
            status: 'WARN' as ServiceState
          }),
          mysql: Bluebird.resolve({ status: 'OK' as ServiceState })
        }
      }).then((result: stateResolver.IServiceResult): void => {
        expect(result.overallStatus).toEqual('WARN')
        expect(result.services.mysql).toEqual({ status: 'OK' })
        expect(result.services.elasticsearch).toEqual({ status: 'WARN' })
      }))
  })
})
