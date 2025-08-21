import React from "react";
import { View, Text } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";

export enum ValuePositionEnum {
    Top = 'top',
    Bottom = 'bottom',
    Inline = 'inline',
}

interface ProfitLossIndicatorProps {
    value: number;
    minimumLimit: number;
    maximumLimit: number;
    valueLabel: string;
    showMinimumLimit?: boolean;
    valuePosition?: ValuePositionEnum;
    limitPrefix?: string;
    limitSuffix?: string;
    positiveValueLabel?: string | null;
    variant?: 'orangeToGreenGradient' | 'greenToOrangeGradient' | 'greenToRedGradient' | 'pfmGradient' | 'default';
    size?: 'lg' | 'default' | 'sm' | 'xs' | 'xxs' | '3xs';
    rounded?: boolean;
}

// Utility function matching the web version
const valueAsPercentage = ({ value, minLimit, maxLimit }: { value: number; minLimit: number; maxLimit: number }) => {
    if (maxLimit === minLimit) return 0;
    const clampedValue = Math.max(minLimit, Math.min(maxLimit, value));
    return ((clampedValue - minLimit) / (maxLimit - minLimit)) * 100;
};

// ProgressLinear component equivalent for React Native
const ProgressLinear = ({
    value,
    minLimit = 0,
    maxLimit,
    variant = 'orangeToGreenGradient',
    size = 'xs',
    opacity = 1,
    customTransform,
    backgroundColor = 'transparent'
}: {
    value: number;
    minLimit?: number;
    maxLimit?: number;
    variant?: string;
    size?: string;
    opacity?: number;
    customTransform?: number;
    backgroundColor?: string;
}) => {
    const percentage = valueAsPercentage({ value, minLimit, maxLimit });

    // Get gradient colors and locations based on variant - matching web exactly
    const getGradientData = () => {
        switch (variant) {
            case 'orangeToGreenGradient':
                return {
                    colors: ['#ec6652', '#f2a94d', '#f5d451', '#74d5a0'], // highlight-red -> yellow -> yellow-light -> green
                    locations: [0, 0.35, 0.65, 1.0] // 0%, 35%, 65%, 100%
                };
            case 'greenToOrangeGradient':
                return {
                    colors: ['#74d5a0', '#f5d451', '#f2a94d', '#ec6652'], // green -> yellow-light -> yellow -> red (reversed)
                    locations: [0, 0.35, 0.65, 1.0]
                };
            case 'greenToRedGradient':
                return {
                    colors: ['#74d5a0', '#f5d451', '#f2a94d', '#ec6652', '#ff323e'], // green -> yellow-light -> yellow -> red -> red-darker
                    locations: [0, 0.25, 0.50, 0.75, 1.0] // 0%, 25%, 50%, 75%, 100%
                };
            case 'pfmGradient':
                return {
                    colors: ['#8B5CF6', '#06B6D4'], // purple -> cyan
                    locations: [0, 1]
                };
            default:
                return {
                    colors: ['#3B82F6'], // primary blue
                    locations: [0]
                };
        }
    };

    // Get height based on size
    const getHeight = () => {
        switch (size) {
            case 'lg': return 24;
            case 'default': return 16;
            case 'sm': return 12;
            case 'xs': return 8;
            case 'xxs': return 6;
            case '3xs': return 4;
            default: return 8;
        }
    };

    const gradientData = getGradientData();
    const height = getHeight();

    return (
        <View style={{
            width: '100%',
            height: height,
            borderRadius: height / 2,
            overflow: 'hidden',
            backgroundColor: backgroundColor === 'transparent' ? 'transparent' : '#1F2937',
            position: 'relative'
        }}>
            <View style={{
                width: '100%',
                height: '100%',
                transform: [{
                    translateX: customTransform !== undefined ? customTransform : -(100 - percentage)
                }]
            }}>
                <LinearGradient
                    colors={gradientData.colors}
                    locations={gradientData.locations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        opacity: opacity
                    }}
                />
            </View>
        </View>
    );
};

const ProfitLossIndicator = ({
    value = 0,
    minimumLimit = 0,
    maximumLimit = 0,
    valueLabel,
    showMinimumLimit = true,
    valuePosition = ValuePositionEnum.Top,
    limitPrefix = '$',
    limitSuffix = '',
    positiveValueLabel = null,
    variant = 'orangeToGreenGradient',
    size = 'xs',
    rounded = true
}: ProfitLossIndicatorProps) => {

    return (
        <View style={{
            gap: 8,
            overflow: 'hidden',
            ...(valuePosition === ValuePositionEnum.Inline ? {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 0
            } : {})
        }}>

            {/* Inline Position - Left Labels */}
            {valuePosition === ValuePositionEnum.Inline && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 4
                }}>
                    {showMinimumLimit && (
                        <Text style={{
                            color: '#EF4444', // text-red-theme
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}>
                            ${minimumLimit.toLocaleString()}
                        </Text>
                    )}
                </View>
            )}

            {/* Progress Bar Container - Exact Web Implementation */}
            <View style={{ position: 'relative', width: '100%', marginTop: 8 }}>
                {/* Background Progress Bar (opacity 20%) - Matches web exactly */}
                <ProgressLinear
                    value={100}
                    minLimit={0}
                    maxLimit={100}
                    variant={variant}
                    size={size}
                    opacity={0.2}
                />

                {/* Negative Value Progress (right-aligned from center) */}
                {value < 0 && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        right: '50%', // absolute top-0 right-1/2
                        width: '100%', // w-full
                        overflow: 'hidden' // overflow-hidden
                    }}>
                        <ProgressLinear
                            value={value}
                            minLimit={0}
                            maxLimit={minimumLimit * -1}
                            variant="orangeToGreenGradient"
                            size={size}
                            backgroundColor="transparent"
                            customTransform={
                                maximumLimit > 0
                                    ? (100 - ((Math.max(value, minimumLimit) / minimumLimit) * 100) / 2)
                                    : 0
                            }
                        />
                    </View>
                )}

                {/* Positive Value Progress (left-aligned from center) */}
                {value >= 0 && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%', // absolute top-0 left-1/2
                        width: '100%', // w-full
                        overflow: 'hidden' // overflow-hidden
                    }}>
                        <ProgressLinear
                            value={value}
                            minLimit={minimumLimit}
                            maxLimit={maximumLimit}
                            variant="orangeToGreenGradient"
                            size="xxs" // Note: web uses xxs for positive values
                            backgroundColor="transparent"
                            customTransform={
                                maximumLimit > 0
                                    ? -(100 - ((Math.min(value, maximumLimit) / maximumLimit) * 100) / 2)
                                    : 0
                            }
                        />
                    </View>
                )}

                {/* Center Line Indicator - Exact web positioning */}
                <Text style={{
                    position: 'absolute',
                    top: -9, // -top-[9px]
                    left: '50%', // left-1/2
                    color: '#FFFFFF', // text-white
                    fontSize: 16,
                    fontFamily: 'Inter',
                    transform: [{ translateX: -4 }] // -translate-x-1/2
                }}>
                    |
                </Text>
            </View>

            {/* Inline Position - Right Labels */}
            {valuePosition === ValuePositionEnum.Inline && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 4
                }}>
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <Text style={{
                            color: '#9CA3AF',
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}>
                            {valueLabel}
                        </Text>
                        {positiveValueLabel ? (
                            <Text style={{
                                color: '#10B981', // text-green-theme
                                fontSize: 14, // text-sm
                                fontFamily: 'Inter'
                            }}>
                                {positiveValueLabel}
                            </Text>
                        ) : (
                            <Text style={{
                                color: '#10B981', // text-green-theme
                                fontSize: 12,
                                fontFamily: 'Inter'
                            }}>
                                ${maximumLimit.toLocaleString()}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Bottom Position Labels */}
            {valuePosition === ValuePositionEnum.Bottom && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 4
                }}>
                    {showMinimumLimit && (
                        <Text style={{
                            color: '#EF4444', // text-red-theme
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}>
                            {limitPrefix}{minimumLimit.toLocaleString()}{limitSuffix}
                        </Text>
                    )}
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <Text style={{
                            color: '#9CA3AF',
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}>
                            {valueLabel}
                        </Text>
                        {positiveValueLabel ? (
                            <Text style={{
                                color: '#10B981', // text-green-theme
                                fontSize: 14, // text-sm
                                fontFamily: 'Inter'
                            }}>
                                {positiveValueLabel}
                            </Text>
                        ) : (
                            <Text style={{
                                color: '#10B981', // text-green-theme
                                fontSize: 12,
                                fontFamily: 'Inter'
                            }}>
                                {limitPrefix}{maximumLimit.toLocaleString()}{limitSuffix}
                            </Text>
                        )}
                    </View>
                </View>
            )}
            {/* Top Position Labels */}
            {valuePosition === ValuePositionEnum.Top && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 4
                }}>
                    {showMinimumLimit && (
                        <Text style={{
                            color: '#EF4444', // text-red-theme
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}>
                            ${minimumLimit.toLocaleString()}
                        </Text>
                    )}
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <Text style={{
                            color: '#9CA3AF',
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}>
                            {valueLabel}
                        </Text>
                        <Text style={{
                            color: '#10B981', // text-green-theme
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}>
                            ${maximumLimit.toLocaleString()}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

export default ProfitLossIndicator;