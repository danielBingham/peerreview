/******************************************************************************
 * A light wrapper around our feature flag information that can live on `Core`
 * and be populated by `FeatureService` for each request.
 ******************************************************************************/
module.exports = class FeatureFlags {


    constructor(features) {
        /**
         * This will be populated by `FeatureService`.
         */
        if ( features ) { 
            this.features = features 
        } else {
            this.features = {}
        }
    }

    setFeatures(features) {
        this.features = features
    }

    hasFeature(name) {
        const feature = this.features[name]

        return feature && feature.status == 'enabled'
    }

}
