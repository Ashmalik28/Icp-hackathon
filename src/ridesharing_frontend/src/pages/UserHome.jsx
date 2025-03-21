import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Fix import path
import "../styles/UserHome.css";

function UserHome() {
  const navigate = useNavigate();
  const { actor, isAuthenticated, principal, postRide, getAllRides, searchRides, requestToJoin, buyTokens, getBalance, cancelRide } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0); // Add token balance state
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [rideDetails, setRideDetails] = useState({
    from: "",
    to: "",
    time: "",
    seats: "",
    price: "",
    driverAssigned: false, // Add this field
  });
  const [userRides, setUserRides] = useState([
    {
      from: "Mumbai",
      to: "Pune",
      time: "10:00",
      seats: 4,
      price: 50,
      driverAssigned: true, // Add this field
      requestedUsers: [], // Add this to track ride requests
    },
  ]); // Example data, replace with actual user rides

  useEffect(() => {
    if (isAuthenticated && actor) {
      fetchRides();
      const interval = setInterval(fetchRides, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, actor, isCreateMode]); // Add isCreateMode as dependency

  const fetchRides = async () => {
    setIsLoading(true);
    try {
      const rides = await getAllRides();
      console.log("Fetched rides:", rides);
      
      if (rides && Array.isArray(rides)) {
        if (isCreateMode) {
          // Show only user's created rides
          const userRides = rides.filter(ride => ride.owner === principal);
          console.log("User rides:", userRides);
          setAvailableRides(userRides);
        } else {
          // Show all open rides not created by the user
          const openRides = rides.filter(ride => 
            ride.status?.Open !== undefined && 
            ride.owner !== principal
          );
          console.log("Open rides:", openRides);
          setAvailableRides(openRides);
        }
      }
    } catch (error) {
      console.error("Failed to fetch rides:", error);
    }
    setIsLoading(false);
  };

  const fetchBalance = async () => {
    const balance = await getBalance();
    setTokenBalance(balance);
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleBuyTokens = async () => {
    setIsLoading(true);
    try {
      const result = await buyTokens(amount);
      if (result) {
        alert("Tokens purchased successfully!");
        await fetchBalance();
        setAmount("");
      }
    } catch (error) {
      console.error("Failed to buy tokens:", error);
      alert("Failed to buy tokens. Please try again.");
    }
    setIsLoading(false);
  };

  const handleCreateRide = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const rideId = await postRide(
        rideDetails.from,
        rideDetails.to,
        Number(rideDetails.seats)
      );
      console.log("Created ride with ID:", rideId);
      
      if (rideId) {
        alert("Ride created successfully!");
        setRideDetails({
          from: "",
          to: "",
          time: "",
          seats: "",
          price: "",
          driverAssigned: false,
        });
        await fetchRides(); // Refresh rides immediately
      }
    } catch (error) {
      console.error("Failed to create ride:", error);
      alert("Failed to create ride. Please try again.");
    }
    setIsLoading(false);
  };

  const handleDeleteRide = async (rideId) => {
    setIsLoading(true);
    try {
      const result = await cancelRide(rideId);
      if (result) {
        alert("Ride cancelled successfully!");
        await fetchRides();
      }
    } catch (error) {
      console.error("Failed to cancel ride:", error);
      alert("Failed to cancel ride. Please try again.");
    }
    setIsLoading(false);
  };

  const handleAcceptRide = async (rideId) => {
    setIsLoading(true);
    try {
      const result = await requestToJoin(rideId);
      if (result) {
        alert("Successfully requested to join the ride!");
        await fetchRides();
      }
    } catch (error) {
      console.error("Failed to join ride:", error);
      alert("Failed to join ride. Please try again.");
    }
    setIsLoading(false);
  };

  const handleSearchRides = async () => {
    setIsLoading(true);
    try {
      console.log("Searching for rides:", { fromLocation, toLocation });
      const rides = await searchRides(
        fromLocation.trim() || null,
        toLocation.trim() || null
      );
      console.log("Search results:", rides);
      setAvailableRides(rides || []);
    } catch (error) {
      console.error("Failed to search rides:", error);
      alert("Failed to search rides. Please try again.");
    }
    setIsLoading(false);
  };

  // Add this new handler
  const handleStartRide = (index) => {
    console.log(`Starting ride ${index}`);
    // Add your ride start logic here
  };

  return (
    <div className="home">
      <nav className="navbar glass">
        <div className="logo">
          Instant Car Pool <span className="icp-text">(ICP)</span>
        </div>
        <div className="nav-links">
          <span className="token-balance glass">
            <i className="fas fa-coins"></i> {tokenBalance} Tokens
          </span>
          <button className="wallet-btn glass" onClick={handleBuyTokens}>
            Buy Tokens
          </button>
          <button
            className="wallet-btn glass"
            onClick={() => console.log("View previous rides...")}
          >
            View Previous Rides
          </button>
          <button className="logout-btn glass" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content glass">
        <h1>Welcome, User!</h1>
        <div className="mode-toggle">
          <button
            className={`toggle-btn glass ${!isCreateMode ? "active" : ""}`}
            onClick={() => setIsCreateMode(false)}
          >
            Find a Ride
          </button>
          <button
            className={`toggle-btn glass ${isCreateMode ? "active" : ""}`}
            onClick={() => setIsCreateMode(true)}
          >
            Create a Ride
          </button>
        </div>
        <div className="search-ride-section">
          {!isCreateMode ? (
            <div className="search-container glass">
              <input
                type="text"
                placeholder="From"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
              />
              <input
                type="text"
                placeholder="To"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
              />
              <button
                className="search-btn glass"
                onClick={handleSearchRides}
              >
                Search Rides
              </button>
            </div>
          ) : (
            <div className="create-ride-container glass">
              <form onSubmit={handleCreateRide}>
                <input
                  type="text"
                  placeholder="From"
                  value={rideDetails.from}
                  onChange={(e) =>
                    setRideDetails({ ...rideDetails, from: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="To"
                  value={rideDetails.to}
                  onChange={(e) =>
                    setRideDetails({ ...rideDetails, to: e.target.value })
                  }
                />
                {/* <input
                  type="time"
                  value={rideDetails.time}
                  onChange={(e) =>
                    setRideDetails({ ...rideDetails, time: e.target.value })
                  }
                /> */}
                <input
                  type="number"
                  placeholder="Maximum Seats"
                  value={rideDetails.seats}
                  onChange={(e) =>
                    setRideDetails({ ...rideDetails, seats: e.target.value })
                  }
                />
                <button type="submit" className="create-btn glass">
                  Create Ride
                </button>
              </form>
            </div>
          )}
        </div>
        <div className="available-rides">
          <h2>{isCreateMode ? "Your Created Rides" : "Available Rides"}</h2>
          <div className="rides-container">
            {isLoading ? (
              <div className="loading">Loading rides...</div>
            ) : availableRides.length === 0 ? (
              <div className="no-rides">
                {isCreateMode 
                  ? "You haven't created any rides yet." 
                  : "No available rides found."}
              </div>
            ) : (
              availableRides.map((ride) => (
                <div className="ride-card glass" key={ride.ride_id}>
                  <div className="ride-info">
                    <h3>{ride.origin} to {ride.destination}</h3>
                    <p>Available Seats: {Number(ride.max_riders) - (ride.riders?.length || 0)}</p>
                    <p>Total Seats: {Number(ride.max_riders)}</p>
                    <p>Created: {new Date(Number(ride.created_at) / 1000000).toLocaleString()}</p>
                    {ride.driver_id && <p>Driver: {ride.driver_id}</p>}
                  </div>
                  {!isCreateMode && ride.status?.Open !== undefined && (
                    <button
                      className="book-btn glass"
                      onClick={() => handleAcceptRide(ride.ride_id)}
                      disabled={ride.riders?.includes(principal)}
                    >
                      {ride.riders?.includes(principal) ? 'Already Joined' : 'Join Ride'}
                    </button>
                  )}
                  {isCreateMode && (
                    <div className="ride-actions">
                      <button
                        className="delete-btn glass"
                        onClick={() => handleDeleteRide(ride.ride_id)}
                      >
                        Cancel Ride
                      </button>
                      {ride.driver_id && (
                        <button
                          className="start-btn glass"
                          onClick={() => handleStartRide(ride.ride_id)}
                        >
                          Start Ride
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserHome;
