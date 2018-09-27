import Bluebird = require('bluebird')
import R = require('ramda')
import { selectCriticalPriority, ServiceState } from './status'

export interface IMiddlewareOptions {
  services: IUnresolvedServices
}

export interface IServiceState {
  status: ServiceState
  message?: string
}

export interface IUnresolvedServices {
  [serviceName: string]: Bluebird<IServiceState>
}

export interface IResolvedServices {
  [serviceName: string]: IServiceState
}

export interface IServiceResult {
  overallStatus: ServiceState
  services: IResolvedServices
}

export const selectOverallStatus = (
  services: IResolvedServices
): ServiceState =>
  R.pipe(R.values, R.reduce(selectCriticalPriority, 'OK'))(services)

export const processResolvedServices = (
  services: IResolvedServices
): IServiceResult =>
  R.applySpec<IServiceResult>({
    overallStatus: selectOverallStatus,
    services: R.identity
  })(services)

export const exceptionToErrorStatus = (error: Error): IServiceState => ({
  message: error.message,
  status: 'ERROR'
})

const mergeProp = R.curry(
  (
    services: IResolvedServices,
    serviceName: string,
    serviceStatus: IServiceState
  ): IResolvedServices => R.assoc(serviceName, serviceStatus, services)
)

export const resolveServicePromiseReducer = (
  services: IResolvedServices,
  [serviceName, servicePromise]: [string, Bluebird<IServiceState>]
): Bluebird<IResolvedServices> =>
  servicePromise
    .then(R.identity)
    .catch(exceptionToErrorStatus)
    .then(mergeProp(services, serviceName))

export const wrappedProps = (
  services: IUnresolvedServices
): Bluebird<IResolvedServices> =>
  Bluebird.reduce(R.toPairs(services), resolveServicePromiseReducer, {})

export const verifyServiceIntegrity = (
  options: IMiddlewareOptions
): Bluebird<IServiceResult> =>
  wrappedProps(options.services).then(processResolvedServices)
