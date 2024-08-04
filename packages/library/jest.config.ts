/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest'
import path from 'path'

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  displayName: "backend",
  transform: { 
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: [ "<rootDir>/test/**/*.spec.ts" ],
  moduleNameMapper: {
    '^@danielbingham/peerreview-core': path.join(__dirname, '../../packages/core/src'),
    '^@danielbingham/peerreview-model': path.join(__dirname, '../../packages/model/src')
  },
  verbose: true
};

export default config;
