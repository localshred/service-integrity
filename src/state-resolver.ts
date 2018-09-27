import Bluebird = require('bluebird')
import R = require('ramda')
import { selectCriticalPriority, ServiceState } from './status'

export interface IMiddlewareOptions {
  services: IUnresolvedService
}

export interface IServiceState {
  status: ServiceState
  message?: string
}

export interface IUnresolvedService {
  [serviceName: string]: Bluebird<IServiceState>
}

export interface IResolvedService {
  [serviceName: string]: IServiceState
}

export interface IServiceResult {
  overallStatus: ServiceState
  services: IResolvedService
}

export const selectOverallStatus: (
  services: IResolvedService
) => ServiceState = services =>
  R.pipe(
    R.values,
    R.reduce<IServiceState, ServiceState>(selectCriticalPriority, 'OK')
  )(services)

export const configureMiddleware = (
  options: IMiddlewareOptions
): Bluebird<IServiceResult> =>
  Bluebird.props(options.services).then(
    (services: IResolvedService): IServiceResult => ({
      overallStatus: selectOverallStatus(services),
      services
    })
  )
