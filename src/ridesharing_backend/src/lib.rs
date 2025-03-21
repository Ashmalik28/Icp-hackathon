use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::caller;
use ic_cdk::{query, update};
use ic_cdk::storage;
use once_cell::sync::Lazy;
use std::collections::{HashMap, HashSet};
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

// Storage Types
type RideStorage = HashMap<String, Ride>;
type NotificationStorage = Vec<Notification>;

static STORAGE_STATE: Lazy<Mutex<(RideStorage, NotificationStorage)>> = 
    Lazy::new(|| Mutex::new((HashMap::new(), Vec::new())));

/// Initialize both token and ride storage
#[ic_cdk::init]
fn init() {
    // Initialize token state
    let restored_token_state: Option<(RideToken,)> = storage::stable_restore().ok();
    let mut token_state = TOKEN_STATE.lock().unwrap();
    *token_state = restored_token_state.unwrap_or_default().0;

    // Initialize ride storage
    let mut storage_state = STORAGE_STATE.lock().unwrap();
    *storage_state = (HashMap::new(), Vec::new());
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
    storage::stable_save((state.clone(),)).expect("❌ Failed to save state");

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
    storage::stable_save((state.clone(),)).expect("❌ Failed to save state");

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
    let token_state = get_token_state().lock().unwrap();
    let storage_state = STORAGE_STATE.lock().unwrap();
    storage::stable_save((&*token_state, &*storage_state))
        .expect("Failed to save state before upgrade");
}

/// Restore state after canister upgrade
#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let (token_state, storage_state): (RideToken, (RideStorage, NotificationStorage)) = 
        storage::stable_restore().unwrap_or_default();
    
    let mut t_state = TOKEN_STATE.lock().unwrap();
    *t_state = token_state;
    
    let mut s_state = STORAGE_STATE.lock().unwrap();
    *s_state = storage_state;
}

#[derive(CandidType, Deserialize, Clone, PartialEq)]
pub enum RideStatus {
    Open,
    InProgress,
    Completed,
    Cancelled,
}

// Notification Structure
#[derive(CandidType, Deserialize, Clone)]
pub struct Notification {
    pub user_id: String,
    pub message: String,
}

// Ride Structure
#[derive(CandidType, Deserialize, Clone)]
pub struct Ride {
    pub ride_id: String,
    pub riders: HashSet<String>,
    pub origin: String,
    pub destination: String,
    pub owner: String,
    pub is_driver: bool,
    pub driver_id: Option<String>, // Driver ID (default: None)
    pub status: RideStatus,
    pub max_riders: usize,
    pub created_at: u64,
}

// Helper Function to Send Notification
fn send_notification(user_id: &str, message: &str) {
    let mut state = STORAGE_STATE.lock().unwrap();
    state.1.push(Notification {
        user_id: user_id.to_string(),
        message: message.to_string(),
    });
}

// Post Ride Function
#[ic_cdk::update]
fn post_ride(user_id: String, origin: String, destination: String, max_riders: usize) -> String {
    let ride_id = format!("ride-{}", ic_cdk::api::time());
    let mut riders = HashSet::new();
    riders.insert(user_id.clone());

    let new_ride = Ride {
        ride_id: ride_id.clone(),
        riders,
        origin,
        destination,
        owner: user_id.clone(),
        is_driver: false,
        driver_id: None,
        status: RideStatus::Open,
        max_riders,
        created_at: ic_cdk::api::time(),
    };

    let mut state = STORAGE_STATE.lock().unwrap();
    state.0.insert(ride_id.clone(), new_ride);
    
    ride_id
}

// Get All Rides
#[ic_cdk::query]
fn get_all_rides() -> Vec<Ride> {
    let state = STORAGE_STATE.lock().unwrap();
    state.0.values().cloned().collect()
}

// Search Rides by Origin, Destination, and Status
#[ic_cdk::query]
fn search_rides(origin: Option<String>, destination: Option<String>, status: Option<RideStatus>) -> Vec<Ride> {
    let state = STORAGE_STATE.lock().unwrap();

    state.0
        .values()
        .filter(|ride| {
            (origin.as_ref().map_or(true, |o| &ride.origin == o)) &&
            (destination.as_ref().map_or(true, |d| &ride.destination == d)) &&
            (status.as_ref().map_or(true, |s| &ride.status == s))
        })
        .cloned()
        .collect()
}

// Request to Join Ride
#[ic_cdk::update]
fn request_to_join(ride_id: String, requester_id: String) -> String {
    let mut state = STORAGE_STATE.lock().unwrap();

    ic_cdk::println!("Received ride_id: {}, requester_id: {}", ride_id, requester_id);

    for (id, ride) in &mut state.0 {
        ic_cdk::println!("Stored ride_id: {}", id);
        if id == &ride_id {
            if ride.status != RideStatus::Open {
                return "Ride is not open for new riders.".to_string();
            }

            if ride.riders.contains(&requester_id) {
                return "You are already part of this ride.".to_string();
            }

            if ride.riders.len() >= ride.max_riders {
                return "Ride is full.".to_string();
            }

            ride.riders.insert(requester_id.clone());
            send_notification(&ride.owner, &format!("User {} requested to join your ride.", requester_id));

            return "Request sent to ride owner.".to_string();
        }
    }

    "Ride not found.".to_string()
}

// Accept Rider Request
#[ic_cdk::update]
fn accept_rider(ride_id: String, owner_id: String, user_id: String) -> String {
    let mut state = STORAGE_STATE.lock().unwrap();

    if let Some(ride) = state.0.get_mut(&ride_id) {
        if ride.owner != owner_id {
            return "Only the ride owner can accept requests.".to_string();
        }

        if ride.riders.len() < ride.max_riders {
            ride.riders.insert(user_id.clone());
            send_notification(&user_id, "Your request to join the ride has been accepted.");
            return "User added to the ride.".to_string();
        }

        return "Ride is already full.".to_string();
    }

    "Ride not found.".to_string()
}

// Cancel Ride
#[ic_cdk::update]
fn cancel_ride(ride_id: String, owner_id: String) -> String {
    let mut state = STORAGE_STATE.lock().unwrap();

    if let Some(ride) = state.0.get_mut(&ride_id) {
        if ride.owner == owner_id {
            ride.status = RideStatus::Cancelled;
            for rider in &ride.riders {
                send_notification(rider, "The ride you joined has been cancelled.");
            }
            return "Ride cancelled successfully.".to_string();
        }
        return "Only the ride owner can cancel the ride.".to_string();
    }

    "Ride not found.".to_string()
}

// Get User Notifications
#[ic_cdk::query]
fn get_notifications(user_id: String) -> Vec<String> {
    let state = STORAGE_STATE.lock().unwrap();

    state.1
        .iter()
        .filter(|n| n.user_id == user_id)
        .map(|n| n.message.clone())
        .collect()
}

fn delete_ride(ride_id: String) {
    let mut state = STORAGE_STATE.lock().unwrap();

    state.0.remove(&ride_id);
}