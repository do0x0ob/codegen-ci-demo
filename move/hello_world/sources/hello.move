module hello_world::greeting;
    use std::string::String;

/// A simple greeting object
public struct Greeting has key, store {
    id: UID,
    message: String,
    owner: address,
}

/// Create a new greeting. Returns the object for composability in programmable transactions.
public fun create_greeting(
    message: String,
    ctx: &mut TxContext,
): Greeting {
    Greeting {
        id: object::new(ctx),
        message,
        owner: tx_context::sender(ctx),
    }
}

/// Update greeting message
public fun update_message(
    greeting: &mut Greeting,
    new_message: String,
) {
    greeting.message = new_message;
}

/// Get greeting message
public fun get_message(greeting: &Greeting): &String {
    &greeting.message
}
