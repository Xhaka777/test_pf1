// hooks/useNetwork.tsx - SIMPLE AND RELIABLE VERSION
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = (state: any) => {
      console.log('[Network] Raw state:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      });

      // ✅ SIMPLE LOGIC: Only care about isConnected, ignore isInternetReachable
      // iOS NetInfo isInternetReachable is unreliable and gives false positives
      const connected = state.isConnected === true;
      
      console.log('[Network] Simple result - connected:', connected);
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