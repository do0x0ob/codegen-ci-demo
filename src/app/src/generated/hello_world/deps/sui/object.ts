/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** Sui object identifiers */

import { bcs } from '@mysten/sui/bcs';
export function UID() {
    return bcs.struct('UID', {
        id: bcs.Address
    });
}