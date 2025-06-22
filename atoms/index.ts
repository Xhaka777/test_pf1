import { atom, createStore } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrencyPair } from '@/api/utils/currency-trade';

export const atomStore: ReturnType<typeof createStore> = createStore();

//Create AsyncStorage adapter for Jotai
const asyncStorage = createJSONStorage<any>(() => AsyncStorage);

export const activeSymbolKey = 'pfo-active-symbol';
export const activeSymbolAtom = atomWithStorage<CurrencyPair | string | undefined>(activeSymbolKey, undefined, asyncStorage);

//for boolean atoms with AsyncStorage, we need to handle the async nature
const _oneClickTradingEnableAtom = atomWithStorage<boolean>(
    'oneClickTradingEnabled',
    false,
    asyncStorage
);

export const oneClickTradingEnabledAtom = atom(
    (get) => get(_oneClickTradingEnableAtom),
    (_, set, value) => {
        set(_oneClickTradingEnableAtom, Boolean(value));
    },
)

const _onChartTradingEnabledAtom = atomWithStorage<boolean>(
    'onChartTradingEnabled',
    false,
    asyncStorage
);

export const onChartTradingEnabledAtom = atom(
    (get) => get(_onChartTradingEnabledAtom),
    (_, set, value) => {
        set(_onChartTradingEnabledAtom, Boolean(value));
    }
)

export const updateOrderCheckboxAtom = atom<boolean>(false);