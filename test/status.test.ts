/* eslint-env jest */

import {
  error,
  ok,
  selectCriticalPriority,
  ServiceState,
  warn
} from '../src/status'

describe('src/status', () => {
  describe('selectCriticalPriority', () => {
    const subject = (
      overallStatus: ServiceState,
      nextStatus: ServiceState
    ): ServiceState =>
      selectCriticalPriority(overallStatus, { status: nextStatus })

    it('selects OK when both are OK', () => {
      expect(subject('OK', 'OK')).toEqual('OK')
    })

    it('selects WARN when both are WARN', () => {
      expect(subject('WARN', 'WARN')).toEqual('WARN')
    })

    it('selects ERROR when both are ERROR', () => {
      expect(subject('ERROR', 'ERROR')).toEqual('ERROR')
    })

    it('selects WARN over OK', () => {
      expect(subject('WARN', 'OK')).toEqual('WARN')
      expect(subject('OK', 'WARN')).toEqual('WARN')
    })

    it('selects ERROR over OK', () => {
      expect(subject('ERROR', 'OK')).toEqual('ERROR')
      expect(subject('OK', 'ERROR')).toEqual('ERROR')
    })

    it('selects ERROR over WARN', () => {
      expect(subject('ERROR', 'WARN')).toEqual('ERROR')
      expect(subject('WARN', 'ERROR')).toEqual('ERROR')
    })
  })

  describe('error', () => {
    it('returns an IServiceState with status of "ERROR"', () => {
      expect(error()).toEqual({ status: 'ERROR' })
    })

    it('returns an IServiceState with status of "ERROR" and a message when given', () => {
      const message = 'Things are broken'
      expect(error(message)).toEqual({ status: 'ERROR', message })
    })
  })

  describe('ok', () => {
    it('returns an IServiceState with status of "OK"', () => {
      expect(ok()).toEqual({ status: 'OK' })
    })

    it('returns an IServiceState with status of "OK" and a message when given', () => {
      const message = 'Things are doing fine'
      expect(ok(message)).toEqual({ status: 'OK', message })
    })
  })

  describe('warn', () => {
    it('returns an IServiceState with status of "WARN"', () => {
      expect(warn()).toEqual({ status: 'WARN' })
    })

    it('returns an IServiceState with status of "WARN" and a message when given', () => {
      const message = 'Things are going south'
      expect(warn(message)).toEqual({ status: 'WARN', message })
    })
  })
})
