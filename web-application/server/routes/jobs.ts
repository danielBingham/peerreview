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
import express, { Request, Response, NextFunction } from 'express'
import { Core } from '@danielbingham/peerreview-core' 
import { JobController } from '../controllers/JobController'

export function initializeJobRoutes(core: Core, router: express.Router) {
    const jobController = new JobController(core)

    router.get('/jobs', function(request: Request, response: Response, next: NextFunction) {
        jobController.getJobs(request, response).catch(function(error: any) {
            next(error)
        })
    })

    router.post('/jobs', function(request: Request, response: Response, next: NextFunction) {
        jobController.postJob(request, response).catch(function(error: any) {
            next(error)
        })
    })

    router.get('/job/:id', function(request: Request, response: Response, next: NextFunction) {
        jobController.getJob(request, response).catch(function(error: any) {
            next(error)
        })
    })

    router.patch('/job/:id', function(request: Request, response: Response, next: NextFunction) {
        jobController.patchJob(request, response).catch(function(error: any) {
            next(error)
        })
    })

    router.delete('/job/:id', function(request: Request, response: Response, next: NextFunction) {
        jobController.deleteJob(request, response).catch(function(error: any) {
            next(error)
        })
    })

}
