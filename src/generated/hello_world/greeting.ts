/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import * as object from './deps/sui/object.js';
export function Greeting() {
    return bcs.struct('Greeting', {
        id: object.UID(),
        message: bcs.string(),
        owner: bcs.Address
    });
}
export function init(packageAddress: string) {
    /**
 * Create a new greeting. Returns the object for composability in programmable
 * transactions.
 */
    function create_greeting(options: {
        arguments: [
            message: RawTransactionArgument<string>
        ];
    }) {
        const argumentsTypes = [
            '0x0000000000000000000000000000000000000000000000000000000000000001::string::String'
        ] satisfies string[];
        return (tx: Transaction) => tx.moveCall({
            package: packageAddress,
            module: 'greeting',
            function: 'create_greeting',
            arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        });
    }
    /** Update greeting message. */
    function update_message(options: {
        arguments: [
            greeting: RawTransactionArgument<string>,
            new_message: RawTransactionArgument<string>
        ];
    }) {
        const argumentsTypes = [
            `${packageAddress}::greeting::Greeting`,
            '0x0000000000000000000000000000000000000000000000000000000000000001::string::String'
        ] satisfies string[];
        return (tx: Transaction) => tx.moveCall({
            package: packageAddress,
            module: 'greeting',
            function: 'update_message',
            arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        });
    }
    /** Returns the greeting message. */
    function message(options: {
        arguments: [
            greeting: RawTransactionArgument<string>
        ];
    }) {
        const argumentsTypes = [
            `${packageAddress}::greeting::Greeting`
        ] satisfies string[];
        return (tx: Transaction) => tx.moveCall({
            package: packageAddress,
            module: 'greeting',
            function: 'message',
            arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        });
    }
    /** Returns the owner address. */
    function owner(options: {
        arguments: [
            greeting: RawTransactionArgument<string>
        ];
    }) {
        const argumentsTypes = [
            `${packageAddress}::greeting::Greeting`
        ] satisfies string[];
        return (tx: Transaction) => tx.moveCall({
            package: packageAddress,
            module: 'greeting',
            function: 'owner',
            arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        });
    }
    return { create_greeting, update_message, message, owner };
}