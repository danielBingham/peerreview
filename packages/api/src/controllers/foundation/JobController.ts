/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

import { Job } from 'bullmq'

import { Core } from '@journalhub/core' 
import { User, JobsResult } from '@journalhub/model'

import { ControllerError } from '../../errors/ControllerError'

export class JobController {
    core: Core

    constructor(core: Core) {
        this.core = core
    }

    async getJobs(currentUser: User): Promise<JobsResult> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User may only get their own jobs (or must be admin).
         * 
         * ********************************************************************/
        
        // Permissions: 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted retrieve jobs.`)
        }

        const jobs = {
            waiting: [],
            active: [],
            completed: []
        }
        
        jobs.waiting = await this.core.queue.getJobs(['waiting'])
        jobs.active = await this.core.queue.getJobs(['active'])
        jobs.completed = await this.core.queue.getJobs(['completed'])

        if ( currentUser.permissions == 'admin' || currentUser.permissions == 'superadmin') {
            return jobs
        }

        let returnJobs = {
            waiting: [],
            active: [],
            completed: []
        }

        for ( const job of jobs.waiting ) {
            if ( job.data.session.user.id == currentUser.id ) {
                returnJobs.waiting.push(job)
            }
        }

        for ( const job of jobs.active) {
            if ( job.data.session.user.id == currentUser.id ) {
                returnJobs.active.push(job)
            }
        }

        for ( const job of jobs.completed) {
            if ( job.data.session.user.id == currentUser.id ) {
                returnJobs.completed.push(job)
            }
        }

        return returnJobs
    }

    async getJob(currentUser: User, id: string): Promise<Job> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User may only get their own job (or must be admin).
         *
         * Validation:
         *
         * 1. :id must be set.
         * 
         * ********************************************************************/

        const jobId = id

        // Validation: 1. :id must be set
        if ( ! jobId ) {
            throw new ControllerError(400, 'id-missing',
                `Attempt to get job, but missing jobId.`)
        }

        // Permissions: 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to get Job(${jobId}).`)
        }
        
        const job = await this.core.queue.getJob(jobId)

        // 2. User may only get their own job (or must be admin).
        if ( job.data.session.user.id !== currentUser.id && currentUser.permissions != 'admin' && currentUser.permissions != 'superadmin' ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempted to access Job(${jobId}) which they did not trigger.`)
        }

        return job
    }

    async postJob(currentUser: User, name: string, data: any): Promise<Job> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         *
         * Validation:
         *
         * 1. body.name must be set and be a valid job.
         * 
         * ********************************************************************/
       
        // Permissions: 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted start a job.`)
        }

        let job = null 
        if ( name == 'initialize-reputation' ) {
            //job = await this.initializeReputation(request, response)
        } 

        // Validation: 1. body.name must be set and be a valid job.
        else {
            throw new ControllerError(400, 'invalid-job',
                `Attempt to trigger invalid job '${name}'.`)
        }

        return job
    }

    async patchJob(): Promise<void> {
        throw new ControllerError(503, 'not-implemented', '')

        // TODO Implement me to allow for pausing and resuming of jobs.
    }

    async deleteJob(): Promise<void> {
        throw new ControllerError(503, 'not-implemented', '')

        // TODO Implement me to allow for canceling of jobs.

    }

    // ================  JOBS ==========================

    async initializeReputation(currentUser: User, data: any): Promise<Job> {
        const userId = data.userId

        // Validation: 1. :user_id must be set.
        if ( ! userId ) {
            throw new ControllerError(400, 'userId-is-required', `User attempted to initialize reputation with out a user_id.`)
        }

        // Permissions: 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to initialize reputation for User(${userId}).`)
        }

        // Permissions: 2. User must be initializing their own reputation.
        // Users may only initialize their own reputation.  We'll add admins
        // who can initialize other users reputation later.
        if ( currentUser.id != userId ) {
            throw new ControllerError(403, 'not-authorized:wrong-user',
                `User(${currentUser.id}) attempted to initialize reputation for User(${userId}).`)
        }

        // If we already have a reputation initialization job in progress for
        // this user, then return that job.
        const jobs = await this.core.queue.getJobs(['active'])
        for ( const job of jobs ) {
            if ( job.name == 'initialize-reputation' && job.data.userId == userId ) {
                return job
            }
        }

        const job = await this.core.queue.add('initialize-reputation', { session: { user: { id: currentUser.id } }, userId: userId })
        return job
    }

}
