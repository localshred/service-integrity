import R = require('ramda')

export type ServiceState = 'OK' | 'WARN' | 'ERROR'

export type ServiceStatePriority = 100 | 200 | 300

export type PriorityToServiceStateLookup = {
  [k in ServiceState]: ServiceStatePriority
}

export interface IServiceState {
  message?: string
  status: ServiceState
}

export const SERVICE_STATE_TO_PRIORITY: PriorityToServiceStateLookup = {
  ERROR: 300,
  OK: 100,
  WARN: 200
}

export const PRIORITY_TO_SERVICE_STATE = {
  [SERVICE_STATE_TO_PRIORITY.ERROR]: 'ERROR',
  [SERVICE_STATE_TO_PRIORITY.OK]: 'OK',
  [SERVICE_STATE_TO_PRIORITY.WARN]: 'WARN'
}

export const selectCriticalPriority = (
  overallStatus: ServiceState,
  { status }: { status: ServiceState }
): ServiceState => {
  const overallStatusPriority = R.prop(overallStatus, SERVICE_STATE_TO_PRIORITY)
  const statusPriority = R.prop(status, SERVICE_STATE_TO_PRIORITY)
  const maxPriority = Math.max(
    overallStatusPriority,
    statusPriority
  ) as ServiceStatePriority
  return PRIORITY_TO_SERVICE_STATE[maxPriority] as ServiceState
}

export const error = (message?: string): IServiceState => ({
  message,
  status: 'ERROR'
})

export const ok = (message?: string): IServiceState => ({
  message,
  status: 'OK'
})

export const warn = (message?: string): IServiceState => ({
  message,
  status: 'WARN'
})
