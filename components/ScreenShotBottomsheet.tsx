import BottomSheet, { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, ImageBackground, Dimensions, Platform, PermissionsAndroid, Alert } from "react-native";
import SelectableButton from "./SelectableButton";
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import images from "@/constants/images";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

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

export interface ScreenShotBottomSheetHandle {
    snapToIndex: (index: number) => void;
    close: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ScreenShotBottomSheet = forwardRef<BottomSheetModal, ScreenShotBottomSheetProps>(
    ({ history, onClose, onScreenShot }, ref) => {
        const [isDownloading, setIsDownloading] = useState(false);
        const cardRef = React.useRef<View>(null);

        const snapPoints = useMemo(() => ['70%','90%'], []);

        const handleClose = useCallback(() => {
            onClose();
        }, [onClose]);

        // Check and request permissions for iOS
        const checkIOSPermissions = useCallback(async () => {
            try {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Required',
                        'This app needs access to your photo library to save screenshots.',
                        [{ text: 'OK' }]
                    );
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Error requesting iOS permissions:', error);
                return false;
            }
        }, []);

        // Check and request permissions for Android
        const checkAndroidPermissions = useCallback(async () => {
            try {
                // For Android 13+ (API level 33+), we don't need WRITE_EXTERNAL_STORAGE
                if (Platform.Version >= 33) {
                    return true;
                }
                
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'This app needs access to storage to save screenshots',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK'
                    }
                );

                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert(
                        'Permission Denied',
                        'Storage permission is required to save screenshots'
                    );
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Error requesting Android permissions:', error);
                return false;
            }
        }, []);

        const handleDownload = useCallback(async () => {
            if (!history || !cardRef.current) {
                Alert.alert('Error', 'Unable to capture screenshot');
                return;
            }

            setIsDownloading(true);

            try {
                console.log('Starting screenshot capture...');
                
                // Check permissions based on platform
                let hasPermission = false;
                if (Platform.OS === 'ios') {
                    hasPermission = await checkIOSPermissions();
                } else {
                    hasPermission = await checkAndroidPermissions();
                }

                if (!hasPermission) {
                    setIsDownloading(false);
                    return;
                }

                console.log('Permissions granted, capturing view...');

                // Capture the view with higher quality settings
                const uri = await captureRef(cardRef.current, {
                    format: 'png',
                    quality: 1.0,
                    result: 'tmpfile',
                    height: undefined,
                    width: undefined,
                    snapshotContentContainer: false,
                });

                console.log('Screenshot captured:', uri);

                if (Platform.OS === 'android') {
                    // For Android, save to MediaLibrary (which handles Downloads folder)
                    const asset = await MediaLibrary.createAssetAsync(uri);
                    
                    // Try to create/add to album
                    try {
                        const album = await MediaLibrary.getAlbumAsync('Trading Screenshots');
                        if (album == null) {
                            await MediaLibrary.createAlbumAsync('Trading Screenshots', asset, false);
                        } else {
                            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                        }
                    } catch (albumError) {
                        console.log('Album creation/addition failed, but image saved:', albumError);
                    }

                    Alert.alert(
                        'Success',
                        'Screenshot saved to your gallery!',
                        [{ text: 'OK' }]
                    );
                } else {
                    // For iOS, save to photo library
                    const asset = await MediaLibrary.createAssetAsync(uri);
                    
                    // Try to create/add to album
                    try {
                        const album = await MediaLibrary.getAlbumAsync('Trading Screenshots');
                        if (album == null) {
                            await MediaLibrary.createAlbumAsync('Trading Screenshots', asset, false);
                        } else {
                            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                        }
                    } catch (albumError) {
                        console.log('Album creation/addition failed, but image saved:', albumError);
                    }

                    Alert.alert(
                        'Success',
                        'Screenshot saved to your Photos!',
                        [{ text: 'OK' }]
                    );
                }

                // Clean up temporary file
                try {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                } catch (cleanupError) {
                    console.log('Cleanup failed:', cleanupError);
                }

                // Call the callback
                onScreenShot(history);

            } catch (error) {
                console.error('Error saving screenshot:', error);
                Alert.alert(
                    'Error', 
                    `Failed to save screenshot: ${error.message || 'Unknown error'}. Please try again.`
                );
            } finally {
                setIsDownloading(false);
            }
        }, [history, checkIOSPermissions, checkAndroidPermissions, onScreenShot]);

        const handleCancel = useCallback(() => {
            handleClose();
        }, [handleClose]);

        if (!history) return null;

        const isProfitable = history.pnl !== undefined && history.pnl > 0;

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                onClose={handleClose}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor: '#100E0F',
                    borderColor: '#1F1B1D',
                    borderWidth: 1
                }}
                handleIndicatorStyle={{ backgroundColor: '#666' }}
            >
                <BottomSheetScrollView
                    className="px-4 pb-4"
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-row items-center justify-between px-4 py-3">
                        <Text className="text-white text-lg font-InterBold">
                            P/L ScreenShot
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 items-center justify-center mb-6">
                        <View className="w-full p-3 relative">
                            <View
                                ref={cardRef}
                                collapsable={false}
                                style={{
                                    width: screenWidth * 0.9,
                                    height: screenWidth * 0.9 * 1.2,
                                }}
                            >
                                <ImageBackground
                                    source={images.pl_frame}
                                    className="w-full h-full rounded-2xl overflow-hidden"
                                    resizeMode="cover"
                                >
                                    <View className="flex-1 p-6 justify-between ml-1">
                                        <View className="mt-2">
                                            <Text className="text-white text-2xl font-InterBold">
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
                                                ${history.entry.toFixed(2)}
                                            </Text>

                                            <Text className="text-gray-300 text-sm font-InterSemiBold mb-1">
                                                Exit Price
                                            </Text>
                                            <Text className="text-white text-lg font-InterSemiBold">
                                                ${history.exit?.toFixed(2) || 'N/A'}
                                            </Text>

                                            <Text className="text-gray-300 text-sm font-InterSemiBold mb-1 mt-4">
                                                P&L
                                            </Text>
                                            <Text className={`text-xl font-InterBold ${isProfitable ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                ${history.pnl.toFixed(2)}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-end justify-center mt-6">
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
                    </View>

                    <View className="flex-row items-center justify-between mb-3">
                        <SelectableButton
                            text='Cancel'
                            isSelected={''}
                            selectedBorderColor="border-primary-100"
                            unselectedBorderColor="border-gray-700"
                            onPress={handleCancel}
                            additionalStyles="mr-3"
                        />
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg border items-center justify-center ${isDownloading
                                ? 'bg-gray-600 border-gray-600'
                                : 'bg-primary-100 border-primary-100'
                                }`}
                            onPress={handleDownload}
                            disabled={isDownloading}
                        >
                            <Text className="text-white font-InterBold">
                                {isDownloading ? 'Saving...' : 'Download'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View className="px-4 mt-4">
                        <Text className="text-gray-400 text-xs text-center">
                            Screenshot will be saved to your {Platform.OS === 'ios' ? 'Photos' : 'Gallery'}
                        </Text>
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>
        )
    }
);

ScreenShotBottomSheet.displayName = 'ScreenShotBottomSheet';
export default ScreenShotBottomSheet;