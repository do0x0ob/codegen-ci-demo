module hello_world::greeting;

use std::string::String;

// ============ Structs ============

/// A simple greeting object.
public struct Greeting has key, store {
    id: UID,
    message: String,
    owner: address,
}

// ============ Public Functions ============

/// Create a new greeting. Returns the object for composability in programmable transactions.
public fun create_greeting(
    message: String,
    ctx: &mut TxContext,
): Greeting {
    Greeting {
        id: object::new(ctx),
        message,
        owner: ctx.sender(),
    }
}

/// Update greeting message.
public fun update_message(
    greeting: &mut Greeting,
    new_message: String,
) {
    greeting.message = new_message;
}

/// Returns the greeting message.
public fun message(greeting: &Greeting): &String {
    &greeting.message
}

/// Returns the owner address.
public fun owner(greeting: &Greeting): address {
    greeting.owner
}
