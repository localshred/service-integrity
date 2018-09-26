import Bluebird = require('bluebird')

export enum ServiceState {
  OK,
  WARN,
  ERROR
}

export interface IMiddlewareOptions {
  services: IService
}

export interface IStatus {
  status: ServiceState
  message?: string
}

export interface IService {
  [serviceName: string]: () => Bluebird<IStatus>
}

export interface IServiceResult {
  overallStatus: ServiceState
  services: {
    [serviceName: string]: IStatus
  }
}

export const configureMiddleware = (
  options: IMiddlewareOptions
): IServiceResult => ({
  overallStatus: ServiceState.OK,
  services: {
    [Object.keys(options.services)[0]]: { status: ServiceState.OK }
  }
})
