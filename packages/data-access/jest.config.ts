/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest'
import path from 'path'

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  displayName: "data-access",
  transform: { 
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: [ "<rootDir>/test/**/*.spec.ts" ],
  moduleNameMapper: {
    '^@journalhub/core': path.join(__dirname, '../../packages/core/src'),
    '^@journalhub/model': path.join(__dirname, '../../packages/model/src'),
    '^@journalhub/features': path.join(__dirname, '../../packages/features/src')
  },
  verbose: true
};

export default config;
