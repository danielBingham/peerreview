/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest'
import path from 'path'

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  displayName: "api",
  transform: { 
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: [ "<rootDir>/test/**/*.spec.ts" ],
  moduleNameMapper: {
    '^@journalhub/core': path.join(__dirname, '../../packages/core/src'),
    '^@journalhub/model': path.join(__dirname, '../../packages/model/src'),
    '^@journalhub/features': path.join(__dirname, '../../packages/features/src'),
    '^@journalhub/data-access': path.join(__dirname, '../../packages/data-access/src'),
    '^@journalhub/service': path.join(__dirname, '../../packages/service/src'),
    '^@journalhub/library': path.join(__dirname, '../../packages/library/src')

  },
  verbose: true
};

export default config;
