use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::caller;
use ic_cdk::{query, update};
use ic_cdk::storage::{stable_restore, stable_save};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;

/// Define total token supply
const TOTAL_SUPPLY: u64 = 1_000_000_000; // 1 Billion RDT Tokens

#[derive(CandidType, Deserialize, Default, Clone, Debug)]
struct RideToken {
    balances: HashMap<Principal, u64>,
    issued_supply: u64,
}

// Use Lazy + Mutex to store the state safely
static TOKEN_STATE: Lazy<Mutex<RideToken>> = Lazy::new(|| Mutex::new(RideToken::default()));

/// Get mutable access to the RideToken state
fn get_token_state() -> &'static Mutex<RideToken> {
    &TOKEN_STATE
}

/// Ensure state is initialized on canister start
#[ic_cdk::init]
fn init() {
    let restored_state: Option<(RideToken,)> = stable_restore().ok();
    let mut state = TOKEN_STATE.lock().unwrap();
    *state = restored_state.unwrap_or_default().0;
}

/// Mint tokens when user buys
#[update]
fn buy_tokens(amount: u64) -> String {
    let buyer: Principal = caller(); // Get the caller's Principal ID
    ic_cdk::println!("🛑 Attempting to mint for: {}", buyer);

    if buyer == Principal::anonymous() {
        return "❌ Error: Cannot mint tokens for anonymous principal.".to_string();
    }

    let mut state = get_token_state().lock().unwrap();

    if state.issued_supply + amount > TOTAL_SUPPLY {
        return "❌ Purchase failed: Exceeds total supply.".to_string();
    }

    let balance = state.balances.entry(buyer.clone()).or_insert(0);
    *balance += amount;
    state.issued_supply += amount;

    // Save state after update
    stable_save((state.clone(),)).expect("❌ Failed to save state");

    let new_balance = *state.balances.get(&buyer).unwrap_or(&0);
    ic_cdk::println!("✅ Minted {} RDT to {}. New balance: {}", amount, buyer, new_balance);

    format!("✅ Minted {} RDT to your wallet!", amount)
}

/// Pay driver for a ride
#[update]
fn pay_for_ride(driver: Principal, amount: u64) -> String {
    let user = caller();
    ic_cdk::println!("🚖 Payment attempt: {} is paying {} RDT to {}", user, amount, driver);

    if user == Principal::anonymous() {
        return "❌ Error: Anonymous principals cannot make payments.".to_string();
    }

    let mut state = get_token_state().lock().unwrap();

    // First, extract balances
    let user_balance = state.balances.get(&user).cloned().unwrap_or(0);
    let driver_balance = state.balances.get(&driver).cloned().unwrap_or(0);

    // Check if user has enough balance
    if user_balance < amount {
        return format!("❌ Payment failed: Insufficient balance. You have {} RDT.", user_balance);
    }

    // Update balances in a separate step
    state.balances.insert(user, user_balance - amount);
    state.balances.insert(driver, driver_balance + amount);

    // Save state after update
    stable_save((state.clone(),)).expect("❌ Failed to save state");

    ic_cdk::println!("✅ Paid {} RDT to driver {}! New balance: {}", amount, driver, user_balance - amount);
    format!("✅ Paid {} RDT to driver {}!", amount, driver)
}

/// Get user balance
#[query]
fn get_balance(user: Principal) -> u64 {
    let state = get_token_state().lock().unwrap();
    let balance = *state.balances.get(&user).unwrap_or(&0);

    ic_cdk::println!("🔍 Balance check for {}: {}", user, balance);
    balance
}

/// Save state before canister upgrade
#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    let state = get_token_state().lock().unwrap();
    stable_save((state.clone(),)).expect("❌ Failed to save state before upgrade");
}

/// Restore state after canister upgrade
#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let restored_state: Option<(RideToken,)> = stable_restore().ok();
    let mut state = get_token_state().lock().unwrap();
    *state = restored_state.unwrap_or_default().0;
}
