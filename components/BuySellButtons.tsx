import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

// Enums to match web version
export enum PositionTypeEnum {
    LONG = 'long',
    SHORT = 'short',
}

interface BuySellButtonsProps {
    buyButtonTitle?: string;
    sellButtonTitle?: string;
    onClickBuy: () => void;
    onClickSell: () => void;
    selectedPositionType: PositionTypeEnum;
    isExpanded?: boolean; // For different styling when expanded
}

export function BuySellButtons({
    buyButtonTitle,
    sellButtonTitle,
    onClickBuy,
    onClickSell,
    selectedPositionType,
    isExpanded = false,
}: BuySellButtonsProps) {
    const { t } = useTranslation();

    const getBuyButtonStyles = () => {
        const baseStyles = "flex-1 rounded-md items-center justify-center";
        const isSelected = selectedPositionType === PositionTypeEnum.LONG;
        
        if (isExpanded) {
            // Expanded state styling
            return `${baseStyles} py-2 px-1 ${
                isSelected 
                    ? 'bg-green-900/30 border border-[#31C48D]' 
                    : 'border border-gray-600'
            }`;
        } else {
            // Collapsed state styling
            return `${baseStyles} py-3 px-6 bg-green-900/30 border border-[#31C48D]`;
        }
    };

    const getSellButtonStyles = () => {
        const baseStyles = "flex-1 rounded-md items-center justify-center";
        const isSelected = selectedPositionType === PositionTypeEnum.SHORT;
        
        if (isExpanded) {
            // Expanded state styling
            return `${baseStyles} py-2 px-1 ${
                isSelected 
                    ? 'bg-red-900/30 border border-[#F05252]' 
                    : 'border border-gray-600'
            }`;
        } else {
            // Collapsed state styling
            return `${baseStyles} py-3 px-6 bg-red-900/30 border border-[#F05252]`;
        }
    };

    const getBuyTextStyles = () => {
        const baseStyles = "font-InterSemiBold";
        const isSelected = selectedPositionType === PositionTypeEnum.LONG;
        
        if (isExpanded) {
            return `${baseStyles} text-sm ${
                isSelected ? 'text-white' : 'text-green-300'
            }`;
        } else {
            return `${baseStyles} text-base text-white`;
        }
    };

    const getSellTextStyles = () => {
        const baseStyles = "font-InterSemiBold";
        const isSelected = selectedPositionType === PositionTypeEnum.SHORT;
        
        if (isExpanded) {
            return `${baseStyles} text-sm ${
                isSelected ? 'text-white' : 'text-red-400'
            }`;
        } else {
            return `${baseStyles} text-base text-white`;
        }
    };

    return (
        <>
            <TouchableOpacity
                className={getBuyButtonStyles()}
                onPress={onClickBuy}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={buyButtonTitle ?? t('Buy')}
                accessibilityState={{ selected: selectedPositionType === PositionTypeEnum.LONG }}
            >
                <Text className={getBuyTextStyles()}>
                    {buyButtonTitle ?? t('Buy')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className={getSellButtonStyles()}
                onPress={onClickSell}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={sellButtonTitle ?? t('Sell')}
                accessibilityState={{ selected: selectedPositionType === PositionTypeEnum.SHORT }}
            >
                <Text className={getSellTextStyles()}>
                    {sellButtonTitle ?? t('Sell')}
                </Text>
            </TouchableOpacity>
        </>
    );
}