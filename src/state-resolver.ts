import Bluebird = require('bluebird')
import R = require('ramda')

export enum ServiceState {
  OK,
  WARN,
  ERROR
}

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
    R.reduce(
      (
        overallStatus: ServiceState,
        { status }: { status: ServiceState }
      ): ServiceState => Math.max(overallStatus, status),
      ServiceState.OK
    )
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
