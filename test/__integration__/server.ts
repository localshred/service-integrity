import express = require('express')
import { createHealthCheck } from '../../src/index'
import { IUnresolvedServices } from '../../src/verify-service-integrity'

export const createTestApp = (
  services: IUnresolvedServices,
  middleware?: express.RequestHandler[]
): express.Application => {
  const app = express()
  createHealthCheck(app, services, { middleware })
  return app
}
