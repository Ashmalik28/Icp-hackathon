import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory, canisterId } from "declarations/ridesharing_backend";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [actor, setActor] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(null);

  const initializeAuthClient = async () => {
    try {
      const authClient = await AuthClient.create();
      if (await authClient.isAuthenticated()) {
        const identity = authClient.getIdentity();
        const agent = new HttpAgent({ identity });
        
        // Check if we're in development
        if (process.env.NODE_ENV !== "production") {
          await agent.fetchRootKey();
        }

        const newActor = Actor.createActor(idlFactory, {
          agent,
          canisterId: canisterId,
        });

        // Test the connection
        try {
          // Attempt a simple call to verify the actor is working
          await newActor.get_name();
          setActor(newActor);
          setPrincipal(identity.getPrincipal().toText());
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Actor verification failed:", error);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      setIsAuthenticated(false);
    }
  };

  const loginWithInternetIdentity = async () => {
    try {
      const authClient = await AuthClient.create();
      return new Promise((resolve, reject) => {
        authClient.login({
          identityProvider: "https://identity.ic0.app/",
          onSuccess: async () => {
            const identity = authClient.getIdentity();
            const agent = new HttpAgent({ identity });
            
            if (process.env.NODE_ENV !== "production") {
              await agent.fetchRootKey();
            }

            const newActor = Actor.createActor(idlFactory, {
              agent,
              canisterId: canisterId,
            });

            setActor(newActor);
            setPrincipal(identity.getPrincipal().toText());
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            resolve(newActor);
          },
          onError: reject,
        });
      });
    } catch (error) {
      console.error("II login failed:", error);
      return null;
    }
  };

  const loginWithPlug = async () => {
    if (!(window.ic && window.ic.plug)) {
      alert("Plug Wallet not installed!");
      return null;
    }

    try {
      const connected = await window.ic.plug.requestConnect();
      if (connected) {
        const plugActor = await window.ic.plug.createActor({
          canisterId: canisterId,
          interfaceFactory: idlFactory,
        });
        setActor(plugActor);
        const principal = await window.ic.plug.getPrincipal();
        setPrincipal(principal.toText());
        setIsAuthenticated(true);
        return plugActor;
      }
    } catch (error) {
      console.error("Plug login failed:", error);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    setActor(null);
    setIsAuthenticated(false);
    setPrincipal(null);
  };

  useEffect(() => {
    if (localStorage.getItem('isAuthenticated')) {
      initializeAuthClient();
    }
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        actor, 
        isAuthenticated, 
        principal, 
        loginWithInternetIdentity,
        loginWithPlug,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
