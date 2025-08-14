import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    Text,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { EvaluatedAccountIcon } from './icons/EvaluatedAccountIcon';
import { FundedAccountIcon } from './icons/FundedAccountIcon';
import AccountIcon from './icons/AccountIcon';
import { PracticeIcon } from './icons/PracticeIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = 550;

interface Account {
    id: string;
    name: string;
    category: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
}

interface AccountSelectorBottomSheetProps {
    onAccountSelect: (accountId: string) => void;
    selectedAccountId?: string;
}

export interface AccountSelectorRef {
    expand: () => void;
    close: () => void;
    snapToIndex: (index: number) => void;
}

// Main AccountSelectorBottomSheet Component
const AccountSelectorBottomSheet = forwardRef<AccountSelectorRef, AccountSelectorBottomSheetProps>(
    ({ onAccountSelect, selectedAccountId = 'evaluation' }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [activeAccount, setActiveAccount] = useState(selectedAccountId);
        const translateY = useSharedValue(BOTTOM_SHEET_HEIGHT);
        const backdropOpacity = useSharedValue(0);

        const accounts: Account[] = [
            {
                id: 'evaluation',
                name: 'Evaluation',
                category: 'Prop Firm Account',
                icon: EvaluatedAccountIcon
            },
            {
                id: 'funded',
                name: 'Funded',
                category: 'Prop Firm Account',
                icon: FundedAccountIcon
            },
            {
                id: 'live',
                name: 'Live',
                category: 'Brokerage Account',
                icon: AccountIcon
            },
            {
                id: 'demo',
                name: 'Demo',
                category: 'Practice Account',
                icon: PracticeIcon
            }
        ];

        // Expose methods to parent component via ref
        useImperativeHandle(ref, () => ({
            expand: () => {
                setIsOpen(true);
            },
            close: () => {
                setIsOpen(false);
            },
            snapToIndex: (index: number) => {
                if (index === 0) {
                    setIsOpen(true);
                } else {
                    setIsOpen(false);
                }
            }
        }));

        useEffect(() => {
            if (isOpen) {
                translateY.value = withSpring(0, {
                    damping: 50,
                    stiffness: 200,
                });
                backdropOpacity.value = withTiming(0.5, { duration: 300 });
            } else {
                translateY.value = withSpring(BOTTOM_SHEET_HEIGHT, {
                    damping: 50,
                    stiffness: 200,
                });
                backdropOpacity.value = withTiming(0, { duration: 300 });
            }
        }, [isOpen]);

        // Update active account when selectedAccountId prop changes
        useEffect(() => {
            setActiveAccount(selectedAccountId);
        }, [selectedAccountId]);

        const bottomSheetStyle = useAnimatedStyle(() => ({
            transform: [{ translateY: translateY.value }],
        }));

        const backdropStyle = useAnimatedStyle(() => ({
            opacity: backdropOpacity.value,
        }));

        const panGesture = Gesture.Pan()
            .onUpdate((event) => {
                if (event.translationY > 0) {
                    translateY.value = event.translationY;
                }
            })
            .onEnd((event) => {
                if (event.translationY > BOTTOM_SHEET_HEIGHT * 0.3) {
                    translateY.value = withSpring(BOTTOM_SHEET_HEIGHT);
                    backdropOpacity.value = withTiming(0);
                    runOnJS(() => setIsOpen(false))();
                } else {
                    translateY.value = withSpring(0);
                }
            });

        const handleAccountSelect = (account: Account) => {
            setActiveAccount(account.id);
            onAccountSelect(account.id);
            setIsOpen(false);
        };

        const handleClose = () => {
            setIsOpen(false);
        };

        if (!isOpen) {
            return null;
        }

        return (
            <View className="absolute inset-0 z-50">
                {/* Backdrop */}
                <Animated.View 
                    style={[backdropStyle]} 
                    className="absolute inset-0 bg-black"
                >
                    <TouchableOpacity 
                        className="flex-1" 
                        onPress={handleClose} 
                    />
                </Animated.View>

                {/* Bottom Sheet */}
                <GestureDetector gesture={panGesture}>
                    <Animated.View 
                        style={[
                            bottomSheetStyle,
                            { 
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: BOTTOM_SHEET_HEIGHT,
                            }
                        ]}
                        className="bg-[#100E0F] rounded-t-[20px] border border-[#1E1E2D] shadow-xl"
                    >
                        {/* Handle */}
                        <View className="w-10 h-1 bg-gray-500 rounded-full self-center mt-3" />

                        {/* Header */}
                        <View className="px-5 py-4  flex-row items-center justify-between">
                            <Text className="text-white text-lg font-semibold">
                                Select Account
                            </Text>
                            <TouchableOpacity onPress={handleClose}>
                                <Text className="text-gray-400 text-2xl">×</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <View className="flex-1 px-5 py-4">
                            {/* Prop Firm Account Section */}
                            <Text className="text-white text-lg font-medium mb-4">
                                Prop Firm Account
                            </Text>
                            
                            {accounts.filter(account => account.category === 'Prop Firm Account').map((account) => (
                                <TouchableOpacity
                                    key={account.id}
                                    className={`flex-row items-center p-4 mb-3 rounded-xl border-2 ${
                                        activeAccount === account.id 
                                            ? 'border-pink-500 bg-[#1A1A1A]' 
                                            : 'border-transparent bg-[#1A1A1A]'
                                    }`}
                                    onPress={() => handleAccountSelect(account)}
                                    activeOpacity={0.7}
                                >
                                    <View className="w-12 h-12 items-center justify-center">
                                        <account.icon size={account.id === 'evaluation' || account.id === 'funded' ? 32 : 40} />
                                    </View>
                                    <Text className="text-white text-lg font-medium ml-4">
                                        {account.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Brokerage Account Section */}
                            <Text className="text-white text-lg font-medium mb-1 mt-2">
                                Brokerage Account
                            </Text>
                            
                            {accounts.filter(account => account.category === 'Brokerage Account').map((account) => (
                                <TouchableOpacity
                                    key={account.id}
                                    className={`flex-row items-center p-4 rounded-xl border-2 ${
                                        activeAccount === account.id 
                                            ? 'border-pink-500 bg-[#1A1A1A]' 
                                            : 'border-transparent bg-[#1A1A1A]'
                                    }`}
                                    onPress={() => handleAccountSelect(account)}
                                    activeOpacity={0.7}
                                >
                                    <View className="w-12 h-12 items-center justify-center">
                                        <account.icon size={40} />
                                    </View>
                                    <Text className="text-white text-lg font-medium ml-4">
                                        {account.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Practice Account Section */}
                            <Text className="text-white text-lg font-medium mb-1 mt-2">
                                Practice Account
                            </Text>
                            
                            {accounts.filter(account => account.category === 'Practice Account').map((account) => (
                                <TouchableOpacity
                                    key={account.id}
                                    className={`flex-row items-center p-4 mb-3 rounded-xl border-2 ${
                                        activeAccount === account.id 
                                            ? 'border-pink-500 bg-[#1A1A1A]' 
                                            : 'border-transparent bg-[#1A1A1A]'
                                    }`}
                                    onPress={() => handleAccountSelect(account)}
                                    activeOpacity={0.7}
                                >
                                    <View className="w-12 h-12 items-center justify-center">
                                        <account.icon size={40} />
                                    </View>
                                    <Text className="text-white text-lg font-medium ml-4">
                                        {account.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                </GestureDetector>
            </View>
        );
    }
);

export default AccountSelectorBottomSheet;