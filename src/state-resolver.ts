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

export interface IResolvedServices {
  [serviceName: string]: IServiceState
}

export interface IServiceResult {
  overallStatus: ServiceState
  services: IResolvedServices
}

export const selectOverallStatus: (
  services: IResolvedServices
) => ServiceState = services =>
  R.pipe(
    R.values,
    R.reduce<IServiceState, ServiceState>(selectCriticalPriority, 'OK')
  )(services)

export const configureMiddleware = (
  options: IMiddlewareOptions
): Bluebird<IServiceResult> =>
  Bluebird.props(options.services).then(
    (services: IResolvedServices): IServiceResult =>
      R.applySpec<IServiceResult>({
        overallStatus: selectOverallStatus,
        services: R.identity
      })(services)
  )
