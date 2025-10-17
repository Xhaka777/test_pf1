import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Function to check connection status
    const checkConnection = (state: any) => {
      // Connected AND has internet access (or internet reachability is unknown)
      const connected = state.isConnected && state.isInternetReachable !== false;
      console.log('[Network]', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        result: connected
      });
      setIsConnected(connected);
    };

    // Check current state immediately
    NetInfo.fetch().then(checkConnection);

    // Subscribe to connection updates
    const unsubscribe = NetInfo.addEventListener(checkConnection);

    return () => unsubscribe();
  }, []);

  return isConnected;
}