/* eslint-env jest */

import Bluebird = require('bluebird')
import { ServiceState } from '../src/status'
import {
  IServiceResult,
  IServiceState,
  selectOverallStatus,
  verifyServiceIntegrity
} from '../src/verify-service-integrity'

const buildState = (status: ServiceState, message?: string): IServiceState => ({
  message,
  status
})

describe('src/verify-service-integrity', () => {
  describe('selectOverallStatus', () => {
    it('returns an overall OK if every service is in the OK state', () => {
      const overallStatus = selectOverallStatus({
        disk: buildState('OK'),
        elasticsearch: buildState('OK'),
        memory: buildState('OK'),
        mysql: buildState('OK')
      })
      expect(overallStatus).toEqual('OK')
    })

    it('returns an overall WARN if at least one service is in the WARN state', () => {
      const overallStatus = selectOverallStatus({
        elasticsearch: buildState('WARN'),
        mysql: buildState('OK')
      })
      expect(overallStatus).toEqual('WARN')
    })

    it('returns an overall ERROR if at least one service is in the ERROR state', () => {
      const overallStatus = selectOverallStatus({
        elasticsearch: buildState('WARN'),
        memcached: buildState('ERROR'),
        mysql: buildState('OK')
      })
      expect(overallStatus).toEqual('ERROR')
    })
  })

  describe('verifyServiceIntegrity', () => {
    it('resolves all service statuses and produces an overallStatus', () =>
      verifyServiceIntegrity({
        services: {
          elasticsearch: Bluebird.resolve(buildState('WARN')),
          memcached: Bluebird.resolve(buildState('ERROR')),
          mysql: Bluebird.resolve(buildState('OK'))
        }
      }).then((result: IServiceResult): void => {
        expect(result.overallStatus).toEqual('ERROR')
        expect(result.services.elasticsearch).toEqual({ status: 'WARN' })
        expect(result.services.memcached).toEqual({ status: 'ERROR' })
        expect(result.services.mysql).toEqual({ status: 'OK' })
      }))
  })
})
