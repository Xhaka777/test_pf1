import BottomSheet, { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Image, ImageBackground } from "react-native";
import SelectableButton from "./SelectableButton";
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import images from "@/constants/images";


interface PositionHistory {
    id: string;
    symbol: string;
    type: 'LONG' | 'SHORT';
    size: number;
    pnl: number;
    entry: number;
    openTime: string;
    exit?: number;
    exitTime: string;
    roi: number;
    fees: number;
    tags: string[];
}

interface ScreenShotBottomSheetProps {
    history: PositionHistory | null;
    onClose: () => void;
    onScreenShot: (history: PositionHistory) => void;
}


const ScreenShotBottomSheet = forwardRef<BottomSheet, ScreenShotBottomSheetProps>(
    ({ history, onClose, onScreenShot }, ref) => {
        const snapPoints = useMemo(() => ['70%'], []);

        const handleClose = useCallback(() => {
            onClose();
        }, [onClose]);

        if (!history) return null;

        const isProfitable = history.pnl !== undefined && history.pnl > 0;



        return (
            <BottomSheet
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                onClose={handleClose}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: '#100E0F', borderColor: '#1F1B1D', borderWidth: 1 }}
                handleIndicatorStyle={{ backgroundColor: '#666' }}
            >

                <BottomSheetScrollView className="px-4 pb-4">
                    <View className="flex-row items-center justify-between px-4 py-3">
                        <Text className="text-white text-lg font-InterBold">
                            P/L ScreenShot
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 items-center justify-center mb-6">
                        <View className="w-[100%] p-3 relative">
                            <ImageBackground
                                source={images.pl_frame}
                                className="w-full h-full rounded-2xl overflow-hidden"
                                resizeMode="cover"
                            >
                                <View className="flex-1 p-6 justify-between ml-1">
                                    <View className="mt-2">
                                        <Text className="text-white text-2xl font-InterBold ">
                                            {history.symbol}
                                        </Text>
                                        <Text className={`text-base font-InterSemiBold ${history.type === 'LONG' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {history.type}
                                        </Text>
                                    </View>

                                    <View className="flex-1 justify-center mt-6">
                                        <Text className="text-gray-300 text-sm font-InterRegular mb-1">
                                            ROI
                                        </Text>
                                        <Text className={`text-4xl font-InterBold mb-4 ${isProfitable ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {history.roi.toFixed(2)}%
                                        </Text>


                                        <Text className="text-gray-300 text-sm font-InterSemiBold mb-1 mt-10">
                                            Entry Price
                                        </Text>
                                        <Text className="text-white text-lg font-InterSemiBold mb-6">
                                            {history.entry.toFixed(2)}
                                        </Text>

                                        <Text className="text-gray-300 text-sm font-InterSemiBold mb-1">
                                            Current Price
                                        </Text>
                                        <Text className="text-white text-lg font-InterSemiBold">
                                            {history.exit?.toFixed(2) || history.exit?.toFixed(2)}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-end justify-center mt-6">
                                        {/* Prop Firm One Logo */}
                                        {/* <View className="flex-row items-center">
                                            <View className="w-8 h-8 bg-blue-500 rounded mr-2 items-center justify-center">
                                                <Text className="text-white font-bold text-xs">P</Text>
                                            </View>
                                            <Text className="text-white font-InterSemiBold text-lg">
                                                Prop Firm One
                                            </Text>
                                        </View> */}

                                        <View className="p-2 rounded ml-10">
                                            <QRCode
                                                value="https://propfirmone.com"
                                                size={48}
                                                color="black"
                                                backgroundColor="white"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </ImageBackground>
                        </View>
                    </View>


                    <View className="flex-row items-center justify-between mb-3">
                        <SelectableButton
                            text='Cancel'
                            isSelected={''}
                            selectedBorderColor="border-primary-100"
                            unselectedBorderColor="border-gray-700"
                            onPress={() => { }}
                            additionalStyles="mr-3"
                        />
                        <TouchableOpacity
                            className='flex-1 py-3 rounded-lg bg-primary-100 border items-center justify-center'
                            onPress={() => { }}
                        >
                            <Text className="text-white font-InterBold">Download</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>

            </BottomSheet>
        )
    }
)

ScreenShotBottomSheet.displayName = 'ScreenShotBottomSheet';
export default ScreenShotBottomSheet;