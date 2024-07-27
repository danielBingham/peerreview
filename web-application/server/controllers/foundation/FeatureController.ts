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
import { Core } from '@danielbingham/peerreview-core' 
import { Feature, PartialFeature, FeatureService, FeatureDAO, FeatureDictionary } from '@danielbingham/peerreview-features'
import { User } from '@danielbingham/peerreview-model'

import { ControllerError } from '../../errors/ControllerError'

export class FeatureController {

    core: Core

    featureService: FeatureService
    featureDAO: FeatureDAO

    constructor(core: Core) {
        this.core = core 

        this.featureService = new FeatureService(core)
        this.featureDAO = new FeatureDAO(core)
    }

    /**
     * If the user is an admin, give them the full list of features. If the
     * user is not an admin, only give them the features that are enabled.
     */
    async getFeatures(permissions?: string): Promise<FeatureDictionary> {
        let results = {}

        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * If the user is an admin, they get the full list, including features
         * that haven't been initialized yet.  Those features only exist in
         * code, so we'll need to walk the list, check the dictionary that we
         * get from the database, add any that are missing.
         *
         * 1. User is an admin => give them the full list.
         * 2. User is not an admin (or not logged in) => give them the list of
         * enabled features.
         * 
         * ********************************************************************/

        // 1. User is an admin => give them the full list.
        if (permissions == 'admin' || permissions == 'superadmin') {
            results = await this.featureDAO.selectFeatures()

            for ( const name in this.featureService.features ) {
                 if ( ! (name in results) ) {
                    results[name] = {
                        name: name,
                        status: 'uncreated'
                    }
                }
            }
        } 

        //  2. User is not an admin (or not logged in) => give them the list of
        // enabled features.
        else {
             results = await this.featureDAO.selectFeatures(`WHERE status = $1`, [ 'enabled' ])
        }

        return results
    }

    /**
     * Insert a feature defined in FeatureService but not yet inserted into the
     * database.
     */
    async postFeatures(currentUser: User, feature: PartialFeature): Promise<Feature> {

        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be an admin or a superadmin.
         *
         * Validation:
         *
         * 3. Request body must contain a feature :name.
         * 4. Feature(:name) must exist in FeatureService.
         * 5. Feature(:name) must not already be in the database.
         * 
         * ********************************************************************/

        // 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `Attempt to initialize a feature from a non-authenticated user.`)
        }

        // 2. User must be an admin or a superadmin.
        if ( currentUser.permissions != 'admin' && currentUser.permissions != 'superadmin' ) {
            throw new ControllerError(403, 'not-authorized',
                `Attempt to initialize a feature from a non-admin user.`)
        }

        const name = feature.name

        // 3. Request body must contain a feature :name.
        if ( ! name ) {
            throw new ControllerError(400, 'missing-input',
                `Attempt to initialize unnamed feature.`)
        }

        // 4. Feature(:name) must exist in FeatureService.
        if ( ! this.featureService.features[name] ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to initialize Feature(${name}) that doesn't exist.`)
        }

        const existing = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        // 5. Feature(:name) must not already be in the database.
        if ( ! ( name in existing)) {
            throw new ControllerError(400, 'already-inserted',
                `Attempt to insert Feature(${name}) that is already inserted.`)
        }

        /**********************************************************************
         * Permissions and Validation complete.
         *      Insert the feature.
         **********************************************************************/

        await this.featureService.insert(name)

        const dictionary = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        if ( ! ( name in  dictionary) ) {
            throw new ControllerError(500, 'server-error',
                `Can't find Feature(${name}) after insertion.`)
        }

        return dictionary[name]
    }

    /**
     * If they are an admin, give them the feature.  If they are a user, only
     * give it to them if its enabled.
     */
    async getFeature(currentUser: User, name: string): Promise<Feature> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. Feature(:name) is enabled => anyone may read it.
         * 2. Feature(:name) is not enabled => only admins and superadmins may
         * read it.
         * 
         * ********************************************************************/

        const feature = await this.featureService.getFeature(name)

        if ( ! feature ) {
            throw new ControllerError(404, 'no-resource',
                `Failed to find Feature(${name}).`)
        }

        // 1. Feature(:name) is enabled => anyone may read it.
        if ( feature.status == 'enabled' ) {
            return feature
        }

        // 2. Feature(:name) is not enabled => only admins and superadmins may
        // read it.
        if ( ! currentUser ) {
            throw new ControllerError(404, 'no-resource',
                `Unauthenticated user attempt to access non-enabled Feature(${name}).`)
        }

        if ( currentUser.permissions != 'admin' && currentUser.permissions != 'superadmin') {
            throw new ControllerError(404, 'no-resource',
                `Non-admin User(${currentUser.id}) attempting to access Feature(${name}).`)
        }

        return feature
    }

    /**
     * Updates to the `status` field of a feature trigger the appropriate migrations.
     */
    async patchFeature(currentUser: User, name: string, featurePatch: PartialFeature): Promise<Feature> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be an admin or a superadmin.
         *
         * Validation:
         *
         * 3. :name must exist
         * 4. Feature(:name) must exist.
         * 5. Feature(:name) must be inserted.
         * 6. Request body must contain a `status` parameter.
         * 7. `status` must be a valid feature status.
         * 8. `status` may not be an in-progress status.
         * 
         * ********************************************************************/

        // 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(404, 'no-resource',
                `Unauthenticated user attempt to access non-enabled Feature(${name}).`)
        }

        // 2. User must be an admin or a superadmin.
        if ( currentUser.permissions != 'admin' && currentUser.permissions != 'superadmin') {
            throw new ControllerError(404, 'no-resource',
                `Non-admin attempting to access Feature(${name}).`)
        }

        // 3. :name must exist
        if ( ! name ) {
            throw new ControllerError(400, 'no-name',
                `Attempt to PATCH a feature with out a name.`)
        }

        const status = featurePatch.status

        // 6. Request body must contain a `status` parameter.
        if ( ! status ) {
            throw new ControllerError(400, 'no-status',
                `Attempt to PATCH a feature with out a status.`)
        }


        const feature = await this.featureService.getFeature(name)

        // 4. Feature(:name) must exist.
        if ( ! feature ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to update Feature(${name}) that doesn't exist.`)
        }

        // 5. Feature(:name) must be inserted.
        if ( feature.status == 'uncreated' ) {
            throw new ControllerError(400, 'not-created',
                `User attempted to PATCH uncreated Feature(${name}).`)
        }

        const validStatuses = [
            'created', 
            'initializing',
            'initialized', 
            'migrating', 
            'migrated', 
            'enabled',
            'disabled',
            'rolling-back', 
            'rolled-back', 
            'uninitializing',
            'uninitialized'
        ]

        // 7. `status` must be a valid feature status.
        if ( ! validStatuses.includes(status) ) {
            throw new ControllerError(400, 'invalid-status',
                `Status ${status} not valid.`)
        }

        // 8. `status` may not be an in-progress status.
        if ( feature.status == 'migrating' || feature.status == 'rolling-back' 
            || feature.status == 'initializing' || feature.status == 'uninitializing' ) 
        {
            throw new ControllerError(400, 'in-progress',
                `Attempt to change status of Feature(${name}) which is currently ${feature.status}.`)
        }
        
        /**********************************************************************
         * Basic Permissions and Validation Complete.
         **********************************************************************/


        // We'll need to take different actions depending on the state we're in
        // and the state we're going for.

        if ( feature.status == 'created' ) {
            if ( status == 'initialized' ) {
                await this.featureService.initialize(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }
        }

        else if ( feature.status == 'initialized') {
            if ( status == 'migrated' ) {
                await this.featureService.migrate(feature.name)
            } 

            else if ( status == 'enabled' ) {
                await this.featureService.migrate(feature.name)
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'uninitialized' ) {
                await this.featureService.uninitialize(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }
        }

        else if ( feature.status == 'migrated' ) { 
            if ( status == 'enabled' ) {
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'rolled-back' ) {
                await this.featureService.rollback(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)

            }
        }

        else if ( feature.status == 'enabled' ) {
            if ( status == 'disabled' ) {
                await this.featureService.disable(feature.name)
            }

            else if ( status == 'rolled-back' ) {
                await this.featureService.rollback(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)

            }
        }

        else if ( feature.status == 'disabled') {
            if ( status == 'enabled' ) {
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'rolled-back' ) {
                await this.featureService.rollback(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }

        }

        else if ( feature.status == 'rolled-back' ) {
            if ( status == 'migrated' ) {
                await this.featureService.migrate(feature.name)
            }

            else if ( status == 'enabled' ) {
                await this.featureService.migrate(feature.name)
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'uninitialized' ) {
                await this.featureService.uninitialize(name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }

        }

        else if ( feature.status == 'uninitialized') {
            if ( status == 'initialized' ) {
                await this.featureService.initialize(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }
        }



        const  after = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        if ( ! ( name in after)) {
            throw new ControllerError(500, 'server-error',
                `Failed to find Feature(${name}) after updating status.`)
        }

        return after[name]
    }

}
