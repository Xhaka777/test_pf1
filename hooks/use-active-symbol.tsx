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
  const route = useRoute<RouteProp<SymbolParamList>>();
  // Cast navigation to the correct type to allow setParams with symbol param
  const navigation = useNavigation() as { setParams: (params: { symbol: string }) => void };
  const [activeSymbol, setActiveSymbol] = atom;

  useEffect(() => {
    const symbolParam = route.params?.symbol;
    
    if (activeSymbol && symbolParam !== activeSymbol) {
      // Update the route params with the new symbol
      navigation.setParams({ symbol: activeSymbol });
    }
    
    if (!activeSymbol && symbolParam) {
      setActiveSymbol(symbolParam);
    }
  }, [activeSymbol, route.params, navigation, setActiveSymbol]);

  return atom;
}