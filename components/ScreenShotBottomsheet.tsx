import BottomSheet, { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { FileIcon, X } from "lucide-react-native";
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, ImageBackground, Dimensions, Platform, PermissionsAndroid, Alert, ActivityIndicator } from "react-native";
import SelectableButton from "./SelectableButton";
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import images from "@/constants/images";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { OpenTradesData } from "@/api/schema";
import { TradeHistoryData } from "@/api/schema/trade-history";
import { TradeSummary } from "@/api/schema/metrics";
import { useFetchPLSSMutation } from "@/api/hooks/trade-service";
import { useGetCurrentUser } from "@/api/hooks/auth";


type TradeData =
    | OpenTradesData['open_trades'][number]
    | TradeHistoryData['all_trades'][number]
    | TradeSummary;


interface ScreenShotBottomSheetProps {
    openTrade: TradeData | null;
    onClose: () => void;
    onScreenShot: (trade: TradeData) => void;
    history?: boolean;
    backtesting?: boolean;
}

export interface ScreenShotBottomSheetHandle {
    snapToIndex: (index: number) => void;
    close: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ScreenShotBottomSheet = forwardRef<BottomSheetModal, ScreenShotBottomSheetProps>(
    ({ openTrade, onClose, onScreenShot, history = false, backtesting = false }, ref) => {

        const [isDownloading, setIsDownloading] = useState(false);
        const cardRef = React.useRef<View>(null);
        const [imageUrl, setImageUrl] = useState<string | null>(null);
        const [useServerImage, setUseServerImage] = useState(true);

        const { mutate: fetchPLSS, data: plssData, isLoading: isFetchingPLSS } = useFetchPLSSMutation();
        const { data: currentUser } = useGetCurrentUser();

        const snapPoints = useMemo(() => ['70%', '90%'], []);

        useEffect(() => {
            if (openTrade && !plssData && currentUser && useServerImage) {
                fetchPLSS(
                    {
                        user_id: currentUser.user_id,
                        account: openTrade.account_id,
                        trade_id: openTrade.order_id,
                        history: history,
                        backtesting: backtesting,
                    },
                    {
                        onSuccess: (data) => {
                            // Convert blob to base64 for React Native
                            const reader = new FileReader();
                            reader.onload = () => {
                                setImageUrl(reader.result as string);
                            };
                            reader.readAsDataURL(data);
                        },
                        onError: (error) => {
                            console.error('Failed to fetch server screenshot:', error);
                            // Fallback to local generation
                            setUseServerImage(false);
                        }
                    }
                );
            }
        }, [openTrade, history, backtesting, fetchPLSS, plssData, currentUser, useServerImage]);

        const handleClose = useCallback(() => {
            setImageUrl(null);
            setUseServerImage(true);
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

        const downloadServerImage = useCallback(async () => {
            if (!imageUrl || !openTrade) return;

            setIsDownloading(true);
            try {
                // Check permissions
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

                // Save base64 image to device
                const filename = `propfirmone-PL-${openTrade.order_id || 'PL_Screenshot'}.png`;
                const fileUri = FileSystem.documentDirectory + filename;

                // Remove data URL prefix if present
                const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');

                await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                // Save to media library
                const asset = await MediaLibrary.createAssetAsync(fileUri);

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
                    'Screenshot saved to your {{location}}!', {
                    location: Platform.OS === 'ios' ? 'Photos' : 'Gallery'
                },
                    [{ text: 'OK' }]
                );

                // Clean up temporary file
                try {
                    await FileSystem.deleteAsync(fileUri, { idempotent: true });
                } catch (cleanupError) {
                    console.log('Cleanup failed:', cleanupError);
                }

                onScreenShot?.(openTrade);

            } catch (error) {
                console.error('Error saving screenshot:', error);
                Alert.alert(
                    'Error',
                    'Failed to save screenshot: {{error}}. Please try again.', {
                    error: error.message || 'Unknown error'
                }
                );
            } finally {
                setIsDownloading(false);
            }
        }, [imageUrl, openTrade, checkIOSPermissions, checkAndroidPermissions, onScreenShot, t]);
        const generateLocalScreenshot = useCallback(async () => {
            if (!openTrade || !cardRef.current) {
                Alert.alert('Error', 'Unable to capture screenshot');
                return;
            }

            setIsDownloading(true);
            try {
                // Check permissions
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

                // Capture the view
                const uri = await captureRef(cardRef.current, {
                    format: 'png',
                    quality: 1.0,
                    result: 'tmpfile',
                });

                // Save to media library
                const asset = await MediaLibrary.createAssetAsync(uri);

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
                    'Screenshot saved to your {{location}}!', {
                    location: Platform.OS === 'ios' ? 'Photos' : 'Gallery'
                },
                    [{ text: 'OK' }]
                );

                // Clean up
                try {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                } catch (cleanupError) {
                    console.log('Cleanup failed:', cleanupError);
                }

                onScreenShot?.(openTrade);

            } catch (error) {
                console.error('Error saving screenshot:', error);
                Alert.alert(
                    'Error',
                    'Failed to save screenshot: {{error}}. Please try again.', {
                    error: error.message || 'Unknown error'
                }
                );
            } finally {
                setIsDownloading(false);
            }
        }, [openTrade, checkIOSPermissions, checkAndroidPermissions, onScreenShot, t]);

        const handleDownload = useCallback(async () => {
            if (useServerImage && imageUrl) {
                await downloadServerImage();
            } else {
                await generateLocalScreenshot();
            }
        }, [useServerImage, imageUrl, downloadServerImage, generateLocalScreenshot]);

        const handleCancel = useCallback(() => {
            handleClose();
        }, [handleClose]);

        if (!openTrade) return null;

        const isProfitable = openTrade.pl !== undefined && openTrade.pl > 0;

        // Render server image or loading state
        const renderServerContent = () => {
            if (isFetchingPLSS) {
                return (
                    <View className="flex-1 items-center justify-center py-8">
                        <ActivityIndicator size="large" color="#EC4899" />
                        <Text className="text-white text-sm mt-4">{'Loading screenshot...'}</Text>
                    </View>
                );
            }

            if (imageUrl) {
                return (
                    <View className="flex-1 items-center justify-center mb-6">
                        <Image
                            source={{ uri: imageUrl }}
                            style={{
                                width: screenWidth * 0.9,
                                height: screenWidth * 0.9 * 1.2,
                            }}
                            resizeMode="contain"
                            className="rounded-2xl"
                        />
                    </View>
                );
            }

            return (
                <View className="flex-1 items-center justify-center py-8">
                    <FileIcon size={40} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm mt-2">{'No image available'}</Text>
                    <TouchableOpacity
                        className="mt-4 px-4 py-2 bg-gray-700 rounded-lg"
                        onPress={() => setUseServerImage(false)}
                    >
                        <Text className="text-white text-sm">{'Generate Local Screenshot'}</Text>
                    </TouchableOpacity>
                </View>
            );
        };

        // Render local screenshot generation
        const renderLocalContent = () => (
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
                                        {openTrade.symbol}
                                    </Text>
                                    <Text className={`text-base font-InterSemiBold ${openTrade.position_type === 'LONG' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {openTrade.position_type || openTrade.type}
                                    </Text>
                                </View>

                                <View className="flex-1 justify-center mt-6">
                                    <Text className="text-gray-300 text-sm font-InterRegular mb-1">
                                        {'ROI'}
                                    </Text>
                                    <Text className={`text-4xl font-InterBold mb-4 ${isProfitable ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {(openTrade.roi || 0).toFixed(2)}%
                                    </Text>

                                    <Text className="text-gray-300 text-sm font-InterSemiBold mb-1 mt-10">
                                        {'Entry Price'}
                                    </Text>
                                    <Text className="text-white text-lg font-InterSemiBold mb-6">
                                        ${(openTrade.entry || 0).toFixed(2)}
                                    </Text>

                                    <Text className="text-gray-300 text-sm font-InterSemiBold mb-1">
                                        {'Exit Price'}
                                    </Text>
                                    <Text className="text-white text-lg font-InterSemiBold">
                                        ${(openTrade.open_time || 0).toFixed(2) || 'N/A'}
                                    </Text>

                                    <Text className="text-gray-300 text-sm font-InterSemiBold mb-1 mt-4">
                                        {'P&L'}
                                    </Text>
                                    <Text className={`text-xl font-InterBold ${isProfitable ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        ${(openTrade.pl || 0).toFixed(2)}
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

                <TouchableOpacity
                    className="mt-4 px-4 py-2 bg-gray-700 rounded-lg"
                    onPress={() => setUseServerImage(true)}
                >
                    <Text className="text-white text-sm">{'Use Server Screenshot'}</Text>
                </TouchableOpacity>
            </View>
        );

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
                            {t('P/L Screenshot')}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Dynamic content based on mode */}
                    {useServerImage ? renderServerContent() : renderLocalContent()}

                    {/* Action buttons */}
                    <View className="flex-row items-center justify-between mb-3">
                        <SelectableButton
                            text={t('Cancel')}
                            isSelected={''}
                            selectedBorderColor="border-primary-100"
                            unselectedBorderColor="border-gray-700"
                            onPress={handleCancel}
                            additionalStyles="mr-3"
                        />
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg border items-center justify-center ${isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS)
                                ? 'bg-gray-600 border-gray-600'
                                : 'bg-primary-100 border-primary-100'
                                }`}
                            onPress={handleDownload}
                            disabled={isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS)}
                        >
                            <Text className="text-white font-InterBold">
                                {isDownloading ? t('Saving...') : t('Download')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="px-4 mt-4">
                        <Text className="text-gray-400 text-xs text-center">
                            {t('Screenshot will be saved to your {{location}}', {
                                location: Platform.OS === 'ios' ? 'Photos' : 'Gallery'
                            })}
                        </Text>
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);

ScreenShotBottomSheet.displayName = 'ScreenShotBottomSheet';
export default ScreenShotBottomSheet;
