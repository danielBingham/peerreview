/******************************************************************************
 * A light wrapper around our feature flag information that can live on `Core`
 * and be populated by `FeatureService` for each request.
 ******************************************************************************/
module.exports = class FeatureFlags {


    constructor(features) {
        /**
         * This will be populated by `FeatureService`.
         */
        this.features = features 
    }

    hasFeature(feature) {
        const feature = this.features[name]

        return feature && feature.status == 'enabled'
    }

}
