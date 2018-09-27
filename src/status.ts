import R = require('ramda')

export type ServiceState = 'OK' | 'WARN' | 'ERROR'
export type ServiceStatePriority = 100 | 200 | 300
export type PriorityToServiceStateLookup = {
  [k in ServiceState]: ServiceStatePriority
}

export interface IServiceState {
  status: ServiceState
  message?: string
}

export const SERVICE_STATE_TO_PRIORITY: PriorityToServiceStateLookup = {
  ERROR: 300,
  OK: 100,
  WARN: 200
}

const priorityToServiceState = (priority: ServiceStatePriority): ServiceState =>
  R.cond([
    [R.equals(SERVICE_STATE_TO_PRIORITY.OK), R.always('OK')],
    [R.equals(SERVICE_STATE_TO_PRIORITY.ERROR), R.always('ERROR')],
    [R.equals(SERVICE_STATE_TO_PRIORITY.WARN), R.always('WARN')],
    [R.T, R.always('ERROR')]
  ])(priority)

export const selectCriticalPriority = (
  overallStatus: ServiceState,
  { status }: { status: ServiceState }
): ServiceState => {
  const overallStatusPriority = R.prop(overallStatus, SERVICE_STATE_TO_PRIORITY)
  const statusPriority = R.prop(status, SERVICE_STATE_TO_PRIORITY)
  const maxPriority = Math.max(overallStatusPriority, statusPriority)
  return priorityToServiceState(maxPriority as ServiceStatePriority)
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
