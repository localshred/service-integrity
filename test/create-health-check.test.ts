/* eslint-env jest */

import * as Bluebird from 'bluebird'
import request = require('supertest')
import { DEFAULT_PATH } from '../src/create-health-check'
import { status } from '../src/index'
import {
  IServiceResult,
  IUnresolvedServices
} from '../src/verify-service-integrity'
import { createTestApp } from './__integration__/server'

describe('src/create-health-check', () => {
  const performRequest = (
    services: IUnresolvedServices
  ): Promise<IServiceResult> =>
    request(createTestApp(services))
      .get(DEFAULT_PATH)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ text }) => JSON.parse(text) as IServiceResult)

  it('registers a GET endpoint at /health/integrity to allow checking registered services', () =>
    performRequest({
      elasticsearch: Bluebird.resolve(status.warn('Connections are slow')),
      mysql: Bluebird.resolve(status.ok())
    }).then((data: IServiceResult) => {
      expect(data).toEqual({
        overallStatus: 'WARN',
        services: {
          elasticsearch: { message: 'Connections are slow', status: 'WARN' },
          mysql: { status: 'OK' }
        }
      })
    }))
})
