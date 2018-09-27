import * as express from 'express'
import * as R from 'ramda'
import {
  IUnresolvedServices,
  verifyServiceIntegrity
} from './verify-service-integrity'

export const DEFAULT_PATH = '/health/integrity'

export const createHealthCheck = (
  app: express.Application,
  services: IUnresolvedServices
) => {
  app.use(DEFAULT_PATH, handler(services))
}

const handler = R.curry(
  (services: IUnresolvedServices, _: express.Request, res: express.Response) =>
    verifyServiceIntegrity({ services }).then(sendJSONResponse(res))
)

export const sendJSONResponse = R.curry(
  (res: express.Response, result: object): express.Response =>
    res.status(200).json(result)
)
