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
import express, { RequestHandler } from 'express'
import { Job } from 'bullmq'

import { Core } from '@danielbingham/peerreview-core' 
import { JobsResult } from '@danielbingham/peerreview-model'

import { JobController } from '../../controllers/foundation/JobController'

export function initializeJobRoutes(core: Core, router: express.Router) {
    const jobController = new JobController(core)

    const getJobs: RequestHandler<{},JobsResult,{},{}> = function(
        req, res, next
    ) {
        jobController.getJobs(req.session.user)
        .then(function(result) {
            res.status(200).json(result)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.get('/jobs', getJobs)

    const postJobs: RequestHandler<{}, Job, { name: string, data: any }, {}> = function(
        req,res,next
    ) {
        jobController.postJob(req.session.user, req.body.name, req.body.data)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })

    }
    router.post('/jobs', postJobs)

    const getJob: RequestHandler<{id: string}, Job, {}, {}> = function(
        req, res, next
    ){ 
        jobController.getJob(req.session.user, req.params.id)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.get('/job/:id', getJob)

}
