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

import { Core } from '@danielbingham/peerreview-core' 
import { Feature, PartialFeature, FeatureDictionary } from '@danielbingham/peerreview-features'

import { FeatureController } from '../../controllers/foundation/FeatureController'

// RequestHandler<Request Params, Response Body, Request Body, Request Query>
export function initializeFeatureRoutes(core: Core, router: express.Router): void {
    const featureController = new FeatureController(core)

    /**************************************************************************
     * GET /features
     *
     * Get the list of enable features visible to the current user.
     *
     **************************************************************************/
    const getFeatures: RequestHandler<{}, FeatureDictionary, {}, {}> = function(
        req, res, next
    ) {
        featureController.getFeatures(req.session?.user?.permissions)
        .then(function(results) {
            res.status(200).json(results)
        }).catch(function(error) {
            next(error)
        })
    }
    router.get('/features', getFeatures)

    /**************************************************************************
     * POST /features
     *
     * Insert a feature defined in code into the database.
     *
     * ************************************************************************/
    const postFeatures: RequestHandler<{}, Feature, PartialFeature, {}>  = function(
        req, res, next
    ) {
        featureController.postFeatures(req.session.user, req.body)
        .then(function(results) {
            res.status(200).json(results)
        }).catch(function(error) {
            next(error)
        })
    }
    router.post('/features', postFeatures)

    /**************************************************************************
     * GET /features/:name
     *
     * Get details of a feature.
     *
     * ************************************************************************/
    const getFeature: RequestHandler<{name: string}, Feature, {}, {}> = function(
        req, res, next
    ) {
        featureController.getFeature(req.session.user, req.params.name)
        .then(function(results) {
            res.status(200).json(results)
        }).catch(function(error) {
            next(error)
        })
    }
    router.get('/feature/:name', getFeature)

    /**************************************************************************
     * PATCH /features/:name
     *
     * Updates the `status` field to trigger the appropriate migrations.
     *
     * ************************************************************************/
    const patchFeature: RequestHandler<{name: string}, Feature, PartialFeature, {}> = function(
        req, res, next
    ){
        featureController.patchFeature(req.session.user, req.params.name, req.body)
        .then(function(results) {
            res.status(201).json(results)
        }).catch(function(error) {
            next(error)
        })
    }
    router.patch('/feature/:name', patchFeature)

}
