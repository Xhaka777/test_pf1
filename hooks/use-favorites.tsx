import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    useGetUserFavorites,
    useAddUserFavorite,
    useRemoveUserFavorite
} from '../api/hooks/user'

export function useFavorites() {
    //Main state for UI rendering
    const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isInitialized = useRef(false);

    //Track symbols with pending API operations
    const pendingSymbols = useRef(new Set<string>());

    const {
        data: favoritesResponse,
        isLoading: isFetchingFavorites,
        isError,
        refetch
    } = useGetUserFavorites();

    const { mutateAsync: addFavorite } = useAddUserFavorite();
    const { mutateAsync: removeFavorite } = useRemoveUserFavorite();

    useEffect(() => {
        if (isInitialized.current || isFetchingFavorites) {
            return;
        }

        if (favoritesResponse) {
            const favorites = favoritesResponse.data || [];
            const apiSymbols = favorites.map(fav => fav.symbol);

            if (!isInitialized.current) {
                setFavoriteSymbols(apiSymbols);
                isInitialized.current = true;
            }
            setIsLoading(false);
        } else if (!isFetchingFavorites && isError) {
            if (!isInitialized.current) {
                setFavoriteSymbols([]);
                isInitialized.current = true;
            }
            setIsLoading(false);
        }
    }, [favoritesResponse, isFetchingFavorites, isError])

    //TODO....
    const toggleFavorite = useCallback(async (symbol: string) => {
        //If already in a pending state, ignore the request
        if (pendingSymbols.current.has(symbol)) {
            return;
        }

        //Check current state
        const isFavorite = favoriteSymbols.includes(symbol);

        setFavoriteSymbols(prev => isFavorite
            ? prev.filter(s => s !== symbol)
            : [...prev, symbol]
        )

        pendingSymbols.current.add(symbol);

        try {
            //Sync with API in background
            if (isFavorite) {
                await removeFavorite({ symbol })
            } else {
                const order = favoriteSymbols.length;
                await addFavorite({ symbol, order })
            }
        } catch (error) {
            console.error('Error toggling favorite', error);

            //Revert the optimistic update
            setFavoriteSymbols(prev =>
                isFavorite
                    ? [...prev, symbol]
                    : prev.filter(s => s !== symbol)
            )
        } finally {
            //Clean up pending state
            pendingSymbols.current.delete(symbol);
        }
    }, [favoriteSymbols, addFavorite, removeFavorite])

    return {
        favoriteSymbols,
        isLoading,
        toggleFavorite,
        refresh: useCallback(() => {
            //Only trigger a refresh if we'wve already initialized
            if (isInitialized.current) {
                return refetch();
            }
        }, [refetch])
    }

}