/* eslint-env jest */

import * as Bluebird from 'bluebird'
import express = require('express')
import * as R from 'ramda'
import request = require('supertest')
import { DEFAULT_PATH } from '../src/create-health-check'
import { status } from '../src/index'
import { IServiceResult } from '../src/verify-service-integrity'
import { createTestApp } from './__integration__/server'

describe('src/create-health-check', () => {
  const performRequest = (
    requestInstance: request.SuperTest<request.Test>
  ): Promise<IServiceResult> =>
    requestInstance
      .get(DEFAULT_PATH)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('content-type', /json/)
      .then(({ text }) => JSON.parse(text) as IServiceResult)

  it('registers a GET endpoint at /health/integrity to allow checking registered services', () =>
    performRequest(
      request(
        createTestApp({
          elasticsearch: R.always(
            Bluebird.resolve(status.warn('Connections are slow'))
          ),
          mysql: R.always(Bluebird.resolve(status.ok()))
        })
      )
    ).then((data: IServiceResult) => {
      expect(data).toEqual({
        overallStatus: 'WARN',
        services: {
          elasticsearch: { message: 'Connections are slow', status: 'WARN' },
          mysql: { status: 'OK' }
        }
      })
    }))

  it('applies any middleware and provides req/res to each service resolver function for acccess to request and locals', () => {
    const fooHeader = 'foo'
    const barHeader = 'bar'
    const expectedMessageFromMiddleware =
      'I can set things from middleware and have access to them when I resolve a service'

    const middleware = [
      (_: object, res: object, next: () => void) => {
        ;(res as express.Response).locals.messageFromMiddleware = expectedMessageFromMiddleware
        next()
      }
    ]
    const services = {
      elasticsearch: (_: object, res: object) =>
        Bluebird.resolve(
          status.warn((res as express.Response).locals.messageFromMiddleware)
        ),
      mysql: (req: object, _: object) =>
        Bluebird.resolve(
          status.ok(
            `${(req as express.Request).headers['x-foo']}-${
              (req as express.Request).headers['x-bar']
            }`
          )
        )
    }
    const app = createTestApp(services, middleware)
    const expectedHeaderMessage = 'foo-bar'
    const requestPromise = request(app)
      .get(DEFAULT_PATH)
      .set('Accept', 'application/json')
      .set('x-foo', fooHeader)
      .set('x-bar', barHeader)
      .expect(200)
      .expect('content-type', /json/)
      .then(({ text }) => JSON.parse(text) as IServiceResult)

    return requestPromise.then((data: IServiceResult) => {
      expect(data).toEqual({
        overallStatus: 'WARN',
        services: {
          elasticsearch: {
            message: expectedMessageFromMiddleware,
            status: 'WARN'
          },
          mysql: { message: expectedHeaderMessage, status: 'OK' }
        }
      })
    })
  })
})
