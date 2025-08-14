import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth, useUser } from "@clerk/clerk-expo";
import { X } from "lucide-react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import SelectableButton from "./SelectableButton";
import { router } from "expo-router";

interface ConfirmBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet>;
    confirmSignOutSheetRef: React.RefObject<BottomSheet>;
}

const ConfirmBottomSheet = ({ bottomSheetRef, confirmSignOutSheetRef }: ConfirmBottomSheetProps) => {
    const { user } = useUser();
    const snapPoints = useMemo(() => ['10%'], []);
    const { isLoaded, signOut } = useAuth();

    const onSignOutPress = () => {
        if (!isLoaded) {
            return;
        }

        try {
            signOut();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error signing out: ', error)
        }
    }


    return (
        <BottomSheet
            ref={confirmSignOutSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={{ backgroundColor: '#1e1e1e' }}
            handleIndicatorStyle={{ backgroundColor: '#666' }}
        >
            <BottomSheetView
                style={{ flex: 1, height: '10%', padding: 4 }}
            >
                <View className="space-y-3 ml-2">
                    <Text className="text-lg text-white font-InterBold mb-2">Sign Out</Text>
                    <Text className="text-base text-gray-500 mb-3 font-Inter">
                        Are you sure you want to sign out from your account?
                    </Text>
                    <View className="flex-row items-center justify-between mb-3">
                        <SelectableButton
                            text='Cancel'
                            isSelected={''}
                            selectedBorderColor="border-primary-100"
                            unselectedBorderColor="border-gray-700"
                            onPress={() => {
                                confirmSignOutSheetRef.current?.close();
                                bottomSheetRef.current?.close();
                            }}
                            additionalStyles="mr-3"
                        />
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg bg-primary-100 border items-center justify-center"
                            onPress={() => {
                                onSignOutPress()
                            }}
                        >
                            <Text className="text-white font-InterBold">Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheetView>
        </BottomSheet>
    )
}

export default ConfirmBottomSheet;