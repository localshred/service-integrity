/* eslint-env jest */

import Bluebird = require('bluebird')
import fs = require('fs')
import { validate } from 'jsonschema'
import path = require('path')
import { IServiceState, ServiceState } from '../src/status'
import {
  IServiceResult,
  selectOverallStatus,
  verifyServiceIntegrity
} from '../src/verify-service-integrity'

const buildState = (status: ServiceState, message?: string): IServiceState => ({
  message,
  status
})

const SCHEMA_FILE_PATH = path.join(__dirname, '..', 'src', 'schema.json')
const readFile = Bluebird.promisify(fs.readFile)
const readSchemaFile = readFile(SCHEMA_FILE_PATH).then((json: Buffer): object =>
  JSON.parse(json.toString())
)

describe('src/verify-service-integrity', () => {
  describe('selectOverallStatus', () => {
    it('returns an overall OK if every service is in the OK state', () => {
      const overallStatus = selectOverallStatus({
        disk: buildState('OK'),
        elasticsearch: buildState('OK'),
        memory: buildState('OK'),
        mysql: buildState('OK')
      })
      expect(overallStatus).toEqual('OK')
    })

    it('returns an overall WARN if at least one service is in the WARN state', () => {
      const overallStatus = selectOverallStatus({
        elasticsearch: buildState('WARN'),
        mysql: buildState('OK')
      })
      expect(overallStatus).toEqual('WARN')
    })

    it('returns an overall ERROR if at least one service is in the ERROR state', () => {
      const overallStatus = selectOverallStatus({
        elasticsearch: buildState('WARN'),
        memcached: buildState('ERROR'),
        mysql: buildState('OK')
      })
      expect(overallStatus).toEqual('ERROR')
    })
  })

  describe('verifyServiceIntegrity', () => {
    it('resolves all service statuses and produces an overallStatus', () =>
      verifyServiceIntegrity({
        services: {
          elasticsearch: Bluebird.resolve(buildState('WARN')),
          memcached: Bluebird.resolve(buildState('ERROR')),
          mysql: Bluebird.resolve(buildState('OK'))
        }
      })
        .then((result: IServiceResult): void => {
          expect(result).toEqual({
            overallStatus: 'ERROR',
            services: {
              elasticsearch: { status: 'WARN' },
              memcached: { status: 'ERROR' },
              mysql: { status: 'OK' }
            }
          })
        })
        .catch(error => expect(error).toBeNull()))

    it('resolves all services even if one or more service rejects its promise', () =>
      verifyServiceIntegrity({
        services: {
          elasticsearch: Bluebird.resolve(buildState('WARN')),
          memcached: Bluebird.reject(
            buildState('ERROR', "Couldn't establish connection")
          ),
          mysql: Bluebird.resolve(buildState('OK'))
        }
      })
        .then((result: IServiceResult): void => {
          expect(result).toEqual({
            overallStatus: 'ERROR',
            services: {
              elasticsearch: { status: 'WARN' },
              memcached: {
                message: "Couldn't establish connection",
                status: 'ERROR'
              },
              mysql: { status: 'OK' }
            }
          })
        })
        .catch(error => expect(error).toBeNull()))

    it('validates with the provided JSON schema', () => {
      const resultPromise = verifyServiceIntegrity({
        services: {
          elasticsearch: Bluebird.resolve(buildState('WARN')),
          memcached: Bluebird.reject(
            buildState('ERROR', "Couldn't establish connection")
          ),
          mysql: Bluebird.resolve(buildState('OK'))
        }
      })

      const validateResult = ({
        result,
        schema
      }: {
      result: IServiceResult
      schema: object
      }): void => {
        const validationResult = validate(result, schema)
        expect(validationResult.errors).toEqual([])
      }

      return Bluebird.props({ result: resultPromise, schema: readSchemaFile })
        .then(validateResult)
        .catch(error => expect(error).toBeNull())
    })
  })
})
