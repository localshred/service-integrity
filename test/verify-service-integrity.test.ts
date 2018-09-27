/* eslint-env jest */

import Bluebird = require('bluebird')
import { ServiceState } from '../src/status'
import {
  IServiceResult,
  IServiceState,
  selectOverallStatus,
  verifyServiceIntegrity
} from '../src/verify-service-integrity'

const resolveToState = (
  status: ServiceState,
  message?: string
): Bluebird<IServiceState> => Bluebird.resolve({ status, message })

describe('src/verify-service-integrity', () => {
  describe('selectOverallStatus', () => {
    it('returns an overall OK if every service is in the OK state', () => {
      const overallStatus = selectOverallStatus({
        disk: { status: 'OK' as ServiceState },
        elasticsearch: { status: 'OK' as ServiceState },
        memory: { status: 'OK' as ServiceState },
        mysql: { status: 'OK' as ServiceState }
      })
      expect(overallStatus).toEqual('OK')
    })

    it('returns an overall WARN if at least one service is in the WARN state', () => {
      const overallStatus = selectOverallStatus({
        elasticsearch: { status: 'WARN' as ServiceState },
        mysql: { status: 'OK' as ServiceState }
      })
      expect(overallStatus).toEqual('WARN')
    })

    it('returns an overall ERROR if at least one service is in the ERROR state', () => {
      const overallStatus = selectOverallStatus({
        elasticsearch: { status: 'WARN' as ServiceState },
        memcached: { status: 'ERROR' as ServiceState },
        mysql: { status: 'OK' as ServiceState }
      })
      expect(overallStatus).toEqual('ERROR')
    })
  })

  describe('verifyServiceIntegrity', () => {
    it('resolves all service statuses and produces an overallStatus', () =>
      verifyServiceIntegrity({
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
