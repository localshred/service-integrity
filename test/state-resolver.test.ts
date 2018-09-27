/* eslint-env jest */

import Bluebird = require('bluebird')
import {
  configureMiddleware,
  IServiceResult,
  IServiceState
} from '../src/state-resolver'
import { ServiceState } from '../src/status'

const resolveToState = (
  status: ServiceState,
  message?: string
): Bluebird<IServiceState> => Bluebird.resolve({ status, message })

describe('src/state-resolver', () => {
  describe('src/configureMiddleware', () => {
    it('resolves all services and produces an overallStatus', () =>
      configureMiddleware({
        services: {
          mysql: resolveToState('OK')
        }
      }).then((result: IServiceResult): void => {
        expect(result.overallStatus).toEqual('OK')
        expect(result.services.mysql).toEqual({ status: 'OK' as ServiceState })
      }))

    it('returns an overall WARN if at least one service is in the WARN state', () =>
      configureMiddleware({
        services: {
          elasticsearch: resolveToState('WARN'),
          mysql: resolveToState('OK')
        }
      }).then((result: IServiceResult): void => {
        expect(result.overallStatus).toEqual('WARN')
        expect(result.services.mysql).toEqual({ status: 'OK' })
        expect(result.services.elasticsearch).toEqual({ status: 'WARN' })
      }))

    it('returns an overall ERROR if at least one service is in the ERROR state', () =>
      configureMiddleware({
        services: {
          elasticsearch: resolveToState('WARN'),
          memcached: resolveToState('ERROR'),
          mysql: resolveToState('OK')
        }
      }).then((result: IServiceResult): void => {
        expect(result.overallStatus).toEqual('ERROR')
        expect(result.services.elasticsearch).toEqual({ status: 'WARN' })
        expect(result.services.memcached).toEqual({ status: 'ERROR' })
        expect(result.services.mysql).toEqual({ status: 'OK' })
      }))
  })
})
