/******************************************************************************
 * A light wrapper around our feature flag information that can live on `Core`
 * and be populated by `FeatureService` for each request.
 ******************************************************************************/

interface FeatureFlagDictionary {
    [ name: string]: boolean
}

export class FeatureFlags {
    features: FeatureFlagDictionary 


    constructor(features?: FeatureFlagDictionary) {
        /**
         * This will be populated by `FeatureService`.
         */
        if ( features ) { 
            this.features = features 
        } else {
            this.features = {}
        }
    }

    setFeatures(features: FeatureFlagDictionary): void {
        this.features = features
    }

    hasFeature(name: string): boolean {
        return (name in this.features) && this.features[name] 
    }

}
