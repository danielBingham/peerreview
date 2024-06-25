/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest'
import path from 'path'

const config: Config = {
  // Run tests from one or more projects
  projects: [ 
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "core",
      transform: { 
        "^.+\\.tsx?$": "ts-jest"
      },
      testMatch: [ "<rootDir>/packages/core/test/**/*.spec.ts" ],
    },
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "model",
      transform: { 
        "^.+\\.tsx?$": "ts-jest"
      },
      testMatch: [ "<rootDir>/packages/model/test/**/*.spec.ts" ],
    },
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "backend",
      transform: { 
        "^.+\\.tsx?$": "ts-jest"
      },
      testMatch: [ "<rootDir>/packages/backend/test/**/*.spec.ts" ],
      moduleNameMapper: {
        '^@danielbingham/peerreview-core': path.join(__dirname, 'packages/core/src'),
        '^@danielbingham/peerreview-model': path.join(__dirname, 'packages/model/src')
      },
    },
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "features",
      transform: { 
        "^.+\\.tsx?$": "ts-jest"
      },
      testMatch: [ "<rootDir>/packages/features/test/**/*.spec.ts" ],
      moduleNameMapper: {
        '^@danielbingham/peerreview-core': path.join(__dirname, 'packages/core/src'),
        '^@danielbingham/peerreview-model': path.join(__dirname, 'packages/model/src')
      },
    },
  ]
};

export default config;
