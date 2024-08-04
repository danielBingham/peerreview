/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest'
import path from 'path'

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  displayName: "service",
  transform: { 
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: [ "<rootDir>/test/**/*.spec.ts" ],
  moduleNameMapper: {
    '^@journalhub/core': path.join(__dirname, '../../packages/core/src'),
    '^@journalhub/model': path.join(__dirname, '../../packages/model/src'),
    '^@journalhub/data-access': path.join(__dirname, '../../packages/data-access/src')
  },
  verbose: true
};

export default config;
