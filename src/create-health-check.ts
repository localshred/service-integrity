import express = require('express')
import * as R from 'ramda'
import {
  IServiceResult,
  IUnresolvedServices,
  verifyServiceIntegrity
} from './verify-service-integrity'

interface IHealthCheckOptions {
  middleware?: express.RequestHandler[]
}

export const DEFAULT_PATH = '/health/integrity'

export const createHealthCheck = (
  app: express.Application,
  services: IUnresolvedServices,
  options?: IHealthCheckOptions
) => {
  const middleware: express.RequestHandler[] = R.propOr(
    [],
    'middleware',
    options
  )
  const handlers = R.append(handler(services), middleware)
  app.get(DEFAULT_PATH, ...handlers)
}

const handler = R.curry(
  (
    services: IUnresolvedServices,
    req: express.Request,
    res: express.Response
  ) => verifyServiceIntegrity(req, res, services).then(sendJSONResponse(res))
)

export const sendJSONResponse = R.curry(
  (res: express.Response, result: IServiceResult): express.Response =>
    res.status(200).json(result)
)
