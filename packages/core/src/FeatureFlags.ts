/******************************************************************************
 * A light wrapper around our feature flag information that can live on `Core`
 * and be populated by `FeatureService` for each request.
 ******************************************************************************/
import { FeatureStatus, FeatureDictionary } from '@journalhub/features'

export class FeatureFlags {
    features: FeatureDictionary 

    constructor(features?: FeatureDictionary) {
        /**
         * This will be populated by `FeatureService`.
         */
        if ( features ) { 
            this.features = features 
        } else {
            this.features = {}
        }
    }

    setFeatures(features: FeatureDictionary): void {
        this.features = features
    }

    hasFeature(name: string): boolean {
        return (name in this.features) && this.features[name].status == FeatureStatus.enabled 
    }

}
