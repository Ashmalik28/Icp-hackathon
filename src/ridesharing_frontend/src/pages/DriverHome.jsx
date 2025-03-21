import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DriverHome.css";

function DriverHome() {
  const navigate = useNavigate();
  const [showManageRidesModal, setShowManageRidesModal] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(150); // Add initial earnings for demo
  const [rides, setRides] = useState([
    {
      id: 1,
      fromLocation: "Mumbai",
      toLocation: "Pune",
      tokens: 50,
      startTime: "2023-12-25T10:00",
      maxPassengers: 3,
      bookedPassengers: 1,
      joined: false,
    },
  ]);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [filteredRides, setFilteredRides] = useState([]);

  const handleSearch = () => {
    const filtered = rides.filter((ride) => {
      const matchFrom = ride.fromLocation
        .toLowerCase()
        .includes(searchFrom.toLowerCase());
      const matchTo = ride.toLocation
        .toLowerCase()
        .includes(searchTo.toLowerCase());
      return matchFrom && matchTo;
    });
    setFilteredRides(filtered);
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleJoinRide = (id) => {
    setRides(
      rides.map((ride) =>
        ride.id === id
          ? {
              ...ride,
              joined: !ride.joined,
              bookedPassengers: ride.joined
                ? ride.bookedPassengers - 1
                : ride.bookedPassengers + 1,
            }
          : ride
      )
    );
  };

  const handleWithdraw = () => {
    alert(`Withdrawing ${totalEarnings} tokens`);
    setTotalEarnings(0);
  };

  return (
    <div className="home">
      <nav className="navbar">
        <div className="logo">
          Instant Car Pool <span className="icp-text">(ICP)</span>
        </div>
        <div className="nav-links">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>Welcome, Driver!</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="From Location"
            value={searchFrom}
            onChange={(e) => setSearchFrom(e.target.value)}
          />
          <input
            type="text"
            placeholder="To Location"
            value={searchTo}
            onChange={(e) => setSearchTo(e.target.value)}
          />
          <button onClick={handleSearch}>Search Rides</button>
        </div>
        <div className="quick-actions">
          <div className="action-card">
            <h3>Available Rides</h3>
            <p>View and join available rides</p>
            <button onClick={() => setShowManageRidesModal(true)}>
              View Rides
            </button>
          </div>
          <div className="action-card">
            <h3>Earnings Overview</h3>
            <p>Track your earnings and payments</p>
            <div className="earnings-container">
              <p className="total-earnings">
                Total Earnings: {totalEarnings} tokens
              </p>
              <button onClick={handleWithdraw} disabled={totalEarnings <= 0}>
                Withdraw Earnings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Create Ride Modal */}

      {/* Modify Manage Rides Modal */}
      {showManageRidesModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Available Rides</h2>
            <div className="rides-list">
              {(filteredRides.length > 0 ? filteredRides : rides).map(
                (ride) => (
                  <div key={ride.id} className="ride-item">
                    <div className="ride-details">
                      <h3>
                        {ride.fromLocation} to {ride.toLocation}
                      </h3>
                      <p>Tokens: {ride.tokens}</p>
                      <p>
                        Start Time: {new Date(ride.startTime).toLocaleString()}
                      </p>
                      <p>
                        Passengers: {ride.bookedPassengers}/{ride.maxPassengers}
                      </p>
                    </div>
                    <div className="ride-actions">
                      <button
                        onClick={() => handleJoinRide(ride.id)}
                        className={ride.joined ? "leave-btn" : "join-btn"}
                      >
                        {ride.joined ? "Leave Ride" : "Join Ride"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowManageRidesModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverHome;
