import Bluebird = require('bluebird')
import R = require('ramda')
import {
  error as statusError,
  IServiceState,
  selectCriticalPriority,
  ServiceState
} from './status'

export interface IUnresolvedServices {
  [serviceName: string]: (req: object, res: object) => Bluebird<IServiceState>
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

export const exceptionToErrorStatus = (error: Error): IServiceState =>
  statusError(error.message)

const mergeProp = R.curry(
  (
    services: IResolvedServices,
    serviceName: string,
    serviceStatus: IServiceState
  ): IResolvedServices => R.assoc(serviceName, serviceStatus, services)
)

export const resolveServicePromiseReducer = R.curry(
  (
    req: object,
    res: object,
    services: IResolvedServices,
    [serviceName, servicePromise]: [
    string,
    (req: object, res: object) => Bluebird<IServiceState>
    ]
  ): Bluebird<IResolvedServices> =>
    servicePromise(req, res)
      .then(R.identity)
      .catch(exceptionToErrorStatus)
      .then(mergeProp(services, serviceName))
)

export const wrappedProps = (
  req: object,
  res: object,
  services: IUnresolvedServices
): Bluebird<IResolvedServices> =>
  Bluebird.reduce(
    R.toPairs(services),
    resolveServicePromiseReducer(req, res),
    {}
  )

export const verifyServiceIntegrity = (
  req: object,
  res: object,
  services: IUnresolvedServices
): Bluebird<IServiceResult> =>
  wrappedProps(req, res, services).then(processResolvedServices)
