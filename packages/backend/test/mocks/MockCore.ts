import { jest } from '@jest/globals'

import { Pool } from 'pg' 
import { ServerClient } from 'postmark'
import _Queue from 'bull'
import type Bull from 'bull/index.d'

const Queue = _Queue as typeof Bull

import Core, { CoreOverrides } from '../../src/core'
import Logger from '../../src/logger'

jest.mock('pg')
jest.mock('postmark')
jest.mock('bull')
jest.mock('../../src/logger')

const dummyConfig = {
    host: 'http://localhost',
    environment: 'test',
    backend: '/api/0.0.0',
    // Database configuration
    database: {
        host: 'http://localhost',
        port: 5432,
        user: 'test-user',
        password: 'test-password',
        name: 'peer_review' 
    },
    redis: {
        host: 'http://localhost',
        port: 6379  
    },
    session: {
        key: 'peer_review_id',
        secret: 'test-secret',
        secure_cookie: false
    },
    s3: {
        bucket_url: 'http://localhost',
        bucket: 'test',
        access_id: 'test-id',
        access_key: 'test-key' 
    },
    orcid: {
        authorization_host: 'http://localhost',
        api_host: 'http://localhost',
        client_id: 'test-id',
        client_secret: 'test-secret',
        authentication_redirect_uri: 'http://localhost',
        connect_redirect_uri: 'http://localhost' 
    },
    postmark: {
        api_token: 'test-token' 
    },
    log_level: -1 
}

const overrides: CoreOverrides = {
    logger: jest.mocked(new Logger()),
    database: jest.mocked(new Pool()),
    postmarkClient: jest.mocked(new ServerClient('test-token')),
    queue: jest.mocked(new Queue('MockQueue'))
}

// Create the core with a dummy config.
export const mockCore = jest.mocked(new Core('test', dummyConfig, overrides))

