import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { activeSymbolAtom } from '@/atoms';

type SymbolParamList = {
  params?: {
    symbol?: string;
  };
};

export function useActiveSymbol() {
  const atom = useAtom(activeSymbolAtom);
  const [activeSymbol, setActiveSymbol] = atom;

  // Safe navigation hooks - only use if inside a navigator
  let route: RouteProp<SymbolParamList> | null = null;
  let navigation: { setParams: (params: { symbol: string }) => void } | null = null;

  try {
    route = useRoute<RouteProp<SymbolParamList>>();
    navigation = useNavigation() as { setParams: (params: { symbol: string }) => void };
  } catch (error) {
    // Hook called outside navigator context - this is fine for providers
    console.log('[useActiveSymbol] Called outside navigator context, using atom only');
  }

  useEffect(() => {
    // Only sync with route params if we have navigation context
    if (!route || !navigation) {
      return;
    }

    const symbolParam = route.params?.symbol;
    
    if (activeSymbol && symbolParam !== activeSymbol) {
      // Update the route params with the new symbol
      try {
        navigation.setParams({ symbol: activeSymbol });
      } catch (error) {
        console.warn('[useActiveSymbol] Failed to update route params:', error);
      }
    }
    
    if (!activeSymbol && symbolParam) {
      setActiveSymbol(symbolParam);
    }
  }, [activeSymbol, route?.params, navigation, setActiveSymbol]);

  return atom;
}

// Alternative: Create a separate hook for use in providers
export function useActiveSymbolAtom() {
  return useAtom(activeSymbolAtom);
}