import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/UserHome.css";

function UserHome() {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    navigate("/");
  };

  const handleBuyTokens = () => {
    // TODO: Implement ICP blockchain integration for token purchase
    console.log("Buy tokens clicked");
  };

  const handleCreateRide = (e) => {
    e.preventDefault();
    // Add the new ride to userRides
    setUserRides([...userRides, { ...rideDetails }]);
    // Reset form
    setRideDetails({
      from: "",
      to: "",
      time: "",
      seats: "",
      price: "",
      driverAssigned: false, // Reset this field
    });
  };

  const handleDeleteRide = (index) => {
    const updatedRides = userRides.filter((_, i) => i !== index);
    setUserRides(updatedRides);
  };

  const handleAcceptRide = (index) => {
    // Here you would typically make an API call to join the ride
    console.log(`Requesting to join ride ${index}`);
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
                onClick={() => console.log("Searching rides...")}
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
            {isCreateMode ? (
              userRides.map((ride, index) => (
                <div className="ride-card glass" key={index}>
                  <div className="ride-info">
                    <h3>
                      {ride.from} to {ride.to}
                    </h3>
                    <p>Time: {ride.time}</p>
                    <p>Maximum Seats: {ride.seats}</p>
                    <p>Driver Assigned: {ride.driverAssigned ? "Yes" : "No"}</p>
                    <div className="ride-price">
                      <i className="fas fa-coins"></i> {ride.price} Tokens
                    </div>
                    <div className="ride-actions">
                      <button
                        className="delete-btn glass"
                        onClick={() => handleDeleteRide(index)}
                      >
                        Delete Ride
                      </button>
                      {ride.driverAssigned && (
                        <button
                          className="start-btn glass"
                          onClick={() => handleStartRide(index)}
                        >
                          Start Ride
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="ride-card glass">
                  <div className="ride-info">
                    <h3>Mumbai to Pune</h3>
                    <p>Time: 10:00 AM</p>
                    <p>Driver: John Doe</p>
                    <div className="ride-price">
                      <i className="fas fa-coins"></i> 50 Tokens
                    </div>
                  </div>
                  <button
                    className="book-btn glass"
                    onClick={() => handleAcceptRide(0)}
                  >
                    Join Ride
                  </button>
                </div>
                <div className="ride-card glass">
                  <div className="ride-info">
                    <h3>Delhi to Agra</h3>
                    <p>Time: 9:00 AM</p>
                    <p>Driver: Jane Smith</p>
                    <div className="ride-price">
                      <i className="fas fa-coins"></i> 40 Tokens
                    </div>
                  </div>
                  <button
                    className="book-btn glass"
                    onClick={() => handleAcceptRide(1)}
                  >
                    Join Ride
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserHome;
