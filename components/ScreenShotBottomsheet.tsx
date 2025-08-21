// components/ScreenShotBottomSheet.tsx - Version without MediaLibrary for Android
import BottomSheet, { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { FileIcon, X, Download, Share2 } from "lucide-react-native";
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, ImageBackground, Dimensions, Platform, PermissionsAndroid, Alert, ActivityIndicator } from "react-native";
import SelectableButton from "./SelectableButton";
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import images from "@/constants/images";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import ViewShot from 'react-native-view-shot';
import { OpenTradesData } from "@/api/schema";
import { TradeHistoryData } from "@/api/schema/trade-history";
import { TradeSummary } from "@/api/schema/metrics";
import { useFetchPLSSMutation } from "@/api/hooks/trade-service";
import { useGetCurrentUser } from "@/api/hooks/auth";
import { useTranslation } from 'react-i18next';

// iOS-only MediaLibrary import (will be tree-shaken out on Android builds)
let MediaLibrary: any = null;
if (Platform.OS === 'ios') {
    MediaLibrary = require('expo-media-library');
}

type TradeData =
    | OpenTradesData['open_trades'][number]
    | TradeHistoryData['all_trades'][number]
    | TradeSummary;

interface ScreenShotBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    history: TradeData | null;
    isHistory?: boolean;
    backtesting?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const ScreenShotBottomSheet = forwardRef<BottomSheetModal, ScreenShotBottomSheetProps>(
    ({ isOpen, onClose, history, isHistory = false, backtesting = false }, ref) => {
        const { t } = useTranslation();
        const [isDownloading, setIsDownloading] = useState(false);
        const cardRef = React.useRef<ViewShot>(null);
        const [imageUrl, setImageUrl] = useState<string | null>(null);
        const [useServerImage, setUseServerImage] = useState(true);

        const { mutate: fetchPLSS, data: plssData, isLoading: isFetchingPLSS } = useFetchPLSSMutation();
        const { data: currentUser } = useGetCurrentUser();

        const snapPoints = useMemo(() => ['70%', '90%'], []);

        const handleClose = useCallback(() => {
            onClose();
        }, [onClose]);

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                handleClose();
            }
        }, [handleClose]);

        useEffect(() => {
            if (history && !plssData && currentUser && useServerImage) {
                fetchPLSS(
                    {
                        user_id: currentUser.user_id,
                        account: history.account_id,
                        trade_id: history.order_id,
                        history: isHistory,
                        backtesting: backtesting,
                    },
                    {
                        onSuccess: (data) => {
                            try {
                                const reader = new FileReader();
                                reader.onload = () => {
                                    const result = reader.result as string;
                                    if (result) {
                                        setImageUrl(result);
                                    } else {
                                        console.warn('Empty result from FileReader');
                                        setUseServerImage(false);
                                    }
                                };
                                reader.onerror = (error) => {
                                    console.error('FileReader error:', error);
                                    setUseServerImage(false);
                                };
                                reader.readAsDataURL(data);
                            } catch (error) {
                                console.error('Error processing server image:', error);
                                setUseServerImage(false);
                            }
                        },
                        onError: (error) => {
                            console.error('Failed to fetch server screenshot:', error);
                            setUseServerImage(false);
                        }
                    }
                );
            }
        }, [history, isHistory, backtesting, fetchPLSS, plssData, currentUser, useServerImage]);

        // Android-specific storage permission request (without MediaLibrary)
        const requestAndroidStoragePermissions = async (): Promise<boolean> => {
            console.log('📱 Requesting Android storage permissions...');
            
            const androidVersion = Platform.Version as number;
            console.log('📱 Android version:', androidVersion);

            if (androidVersion >= 33) {
                // Android 13+ - Scoped storage, no explicit permission needed for app's own files
                console.log('📱 Android 13+ - Using scoped storage (no explicit permission needed)');
                return true;
            } else if (androidVersion >= 29) {
                // Android 10-12 - Request WRITE_EXTERNAL_STORAGE but use scoped storage
                console.log('📱 Android 10-12 - Requesting WRITE_EXTERNAL_STORAGE permission');
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        {
                            title: 'Storage Permission',
                            message: 'This app needs access to save images to your gallery',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );
                    console.log('📱 Storage permission result:', granted);
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                } catch (error) {
                    console.error('❌ Error requesting storage permission:', error);
                    return false;
                }
            } else {
                // Android 9 and below - Request WRITE_EXTERNAL_STORAGE
                console.log('📱 Android 9 and below - Requesting WRITE_EXTERNAL_STORAGE permission');
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        {
                            title: 'Storage Permission',
                            message: 'This app needs access to save images to your device',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                } catch (error) {
                    console.error('❌ Error requesting storage permission:', error);
                    return false;
                }
            }
        };

        // iOS-specific permission request using MediaLibrary
        const requestIOSPermissions = async (): Promise<boolean> => {
            if (!MediaLibrary) {
                console.error('❌ MediaLibrary not available on iOS');
                return false;
            }

            try {
                console.log('🍎 iOS - requesting MediaLibrary permissions');
                const { status } = await MediaLibrary.requestPermissionsAsync();
                console.log('🍎 MediaLibrary permission result:', status);
                return status === 'granted';
            } catch (error) {
                console.error('❌ Error requesting iOS permissions:', error);
                return false;
            }
        };

        // Platform-agnostic permission request
        const requestPermissions = async (): Promise<boolean> => {
            console.log('🔐 Requesting permissions...');
            
            if (Platform.OS === 'web') {
                console.log('🌐 Web platform - no permissions needed');
                return true;
            }

            if (Platform.OS === 'android') {
                return await requestAndroidStoragePermissions();
            } else if (Platform.OS === 'ios') {
                return await requestIOSPermissions();
            }

            return false;
        };

        // Android-specific save function (without MediaLibrary)
        const saveToAndroidGallery = async (uri: string): Promise<boolean> => {
            try {
                console.log('📱 Saving to Android gallery without MediaLibrary...');
                
                const androidVersion = Platform.Version as number;
                const fileName = `trading-screenshot-${Date.now()}.png`;
                
                if (androidVersion >= 29) {
                    // Android 10+ - Use scoped storage approach
                    console.log('📱 Using Android scoped storage approach');
                    
                    // Method 1: Try to save to Pictures directory using FileSystem
                    try {
                        const picturesDir = FileSystem.documentDirectory + 'Pictures/';
                        
                        // Ensure Pictures directory exists
                        const dirInfo = await FileSystem.getInfoAsync(picturesDir);
                        if (!dirInfo.exists) {
                            await FileSystem.makeDirectoryAsync(picturesDir, { intermediates: true });
                        }
                        
                        const finalPath = picturesDir + fileName;
                        await FileSystem.copyAsync({
                            from: uri,
                            to: finalPath
                        });
                        
                        console.log('📱 Method 1 success: Image saved to Pictures directory');
                        return true;
                    } catch (method1Error) {
                        console.log('📱 Method 1 failed:', method1Error.message);
                        
                        // Method 2: Try to save to Downloads directory
                        try {
                            const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
                            
                            const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
                            if (!dirInfo.exists) {
                                await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
                            }
                            
                            const finalPath = downloadsDir + fileName;
                            await FileSystem.copyAsync({
                                from: uri,
                                to: finalPath
                            });
                            
                            console.log('📱 Method 2 success: Image saved to Downloads directory');
                            return true;
                        } catch (method2Error) {
                            console.log('📱 Method 2 failed:', method2Error.message);
                            
                            // Method 3: Save to app's document directory (always works)
                            try {
                                const appDir = FileSystem.documentDirectory + 'Screenshots/';
                                
                                const dirInfo = await FileSystem.getInfoAsync(appDir);
                                if (!dirInfo.exists) {
                                    await FileSystem.makeDirectoryAsync(appDir, { intermediates: true });
                                }
                                
                                const finalPath = appDir + fileName;
                                await FileSystem.copyAsync({
                                    from: uri,
                                    to: finalPath
                                });
                                
                                console.log('📱 Method 3 success: Image saved to app directory');
                                Alert.alert(
                                    'Image Saved',
                                    `Screenshot saved to app directory: ${finalPath}`,
                                    [{ text: 'OK' }]
                                );
                                return true;
                            } catch (method3Error) {
                                console.log('📱 Method 3 failed:', method3Error.message);
                                throw method3Error;
                            }
                        }
                    }
                } else {
                    // Android 9 and below - Try to save to external storage
                    console.log('📱 Using legacy Android storage approach');
                    
                    // Try to save to external storage (if permission granted)
                    const externalDir = FileSystem.documentDirectory + '../../../Pictures/';
                    const finalPath = externalDir + fileName;
                    
                    await FileSystem.copyAsync({
                        from: uri,
                        to: finalPath
                    });
                    
                    console.log('📱 Legacy method success: Image saved to external Pictures');
                    return true;
                }
            } catch (error) {
                console.error('❌ Android save failed:', error);
                
                // Final fallback: Save to app's document directory
                try {
                    const fallbackPath = FileSystem.documentDirectory + `screenshot-${Date.now()}.png`;
                    await FileSystem.copyAsync({
                        from: uri,
                        to: fallbackPath
                    });
                    
                    console.log('📱 Fallback success: Image saved to app directory');
                    Alert.alert(
                        'Image Saved',
                        'Screenshot saved to app directory. You can find it in the file manager.',
                        [{ text: 'OK' }]
                    );
                    return true;
                } catch (fallbackError) {
                    console.error('❌ Fallback save failed:', fallbackError);
                    return false;
                }
            }
        };

        // iOS-specific save function using MediaLibrary
        const saveToIOSGallery = async (uri: string): Promise<boolean> => {
            if (!MediaLibrary) {
                console.error('❌ MediaLibrary not available for iOS');
                return false;
            }

            try {
                console.log('🍎 Saving to iOS gallery using MediaLibrary...');
                await MediaLibrary.saveToLibraryAsync(uri);
                console.log('🍎 iOS save success');
                return true;
            } catch (error) {
                console.error('❌ iOS save failed:', error);
                
                // Fallback: try createAssetAsync
                try {
                    console.log('🍎 Trying iOS fallback method...');
                    await MediaLibrary.createAssetAsync(uri);
                    console.log('🍎 iOS fallback success');
                    return true;
                } catch (fallbackError) {
                    console.error('❌ iOS fallback failed:', fallbackError);
                    return false;
                }
            }
        };

        // Download function for web platform
        const downloadForWeb = (uri: string) => {
            try {
                console.log('🌐 Starting web download...');
                const link = document.createElement('a');
                link.href = uri;
                link.download = `trading-summary-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log('✅ Web download completed');
                Alert.alert('Success', 'Image downloaded successfully!');
            } catch (error) {
                console.error('❌ Web download error:', error);
                Alert.alert('Error', 'Failed to download image on web');
            }
        };

        // Main download function
        const handleDownload = async () => {
            console.log('📸 Starting download process...');
            console.log('📸 Platform:', Platform.OS);
            
            try {
                setIsDownloading(true);
                
                let uri: string | undefined;

                if (useServerImage && imageUrl) {
                    console.log('📸 Using server image');
                    uri = imageUrl;
                } else {
                    console.log('📸 Generating local image with ViewShot...');
                    
                    if (!cardRef.current) {
                        console.error('❌ cardRef.current is null');
                        Alert.alert('Error', 'Screenshot component not ready');
                        return;
                    }

                    try {
                        console.log('📸 Calling ViewShot.capture...');
                        uri = await cardRef.current.capture({
                            format: 'png',
                            quality: 1.0,
                            result: 'tmpfile',
                        });
                        console.log('📸 ViewShot capture result:', uri);
                    } catch (captureError) {
                        console.error('❌ ViewShot capture error:', captureError);
                        
                        console.log('📸 Trying fallback with captureRef...');
                        try {
                            uri = await captureRef(cardRef, {
                                format: 'png',
                                quality: 1.0,
                                result: 'tmpfile',
                            });
                            console.log('📸 captureRef result:', uri);
                        } catch (fallbackError) {
                            console.error('❌ captureRef fallback error:', fallbackError);
                            throw new Error(`Both ViewShot and captureRef failed: ${captureError.message}`);
                        }
                    }
                }

                if (!uri) {
                    console.error('❌ No URI generated');
                    Alert.alert('Error', 'Failed to generate image');
                    return;
                }

                console.log('📸 Generated URI:', uri);

                // Platform-specific saving
                if (Platform.OS === 'web') {
                    downloadForWeb(uri);
                } else {
                    // Request permissions first
                    const hasPermission = await requestPermissions();
                    console.log('🔐 Permission granted:', hasPermission);
                    
                    if (!hasPermission && Platform.OS === 'ios') {
                        Alert.alert('Permission Required', 'Please grant permission to save images to your photo library');
                        return;
                    }

                    // Save to gallery based on platform
                    let saveSuccess = false;
                    
                    if (Platform.OS === 'android') {
                        saveSuccess = await saveToAndroidGallery(uri);
                    } else if (Platform.OS === 'ios') {
                        saveSuccess = await saveToIOSGallery(uri);
                    }

                    if (saveSuccess) {
                        console.log('✅ Download completed successfully');
                        Alert.alert('Success', 'Trading screenshot saved successfully!');
                    } else {
                        Alert.alert('Error', 'Failed to save image to gallery');
                    }
                }
            } catch (error) {
                console.error('❌ Error in handleDownload:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                Alert.alert('Error', `Failed to save image: ${errorMessage}`);
            } finally {
                setIsDownloading(false);
                console.log('📸 Download process completed');
            }
        };

        // Share function (unchanged, as Sharing works on both platforms)
        const handleShare = async () => {
            if (Platform.OS === 'web') {
                Alert.alert('Not Available', 'Sharing is not available on web. Use the download button instead.');
                return;
            }

            console.log('📤 Starting share process...');

            try {
                setIsDownloading(true);
                
                let uri: string | undefined;

                if (useServerImage && imageUrl) {
                    console.log('📤 Using server image for sharing');
                    uri = imageUrl;
                } else {
                    console.log('📤 Generating local image for sharing...');
                    
                    if (!cardRef.current) {
                        console.error('❌ cardRef.current is null for sharing');
                        Alert.alert('Error', 'Screenshot component not ready');
                        return;
                    }

                    try {
                        uri = await cardRef.current.capture({
                            format: 'png',
                            quality: 1.0,
                            result: 'tmpfile',
                        });
                        console.log('📤 Share image generated:', uri);
                    } catch (captureError) {
                        console.error('❌ Share capture error:', captureError);
                        uri = await captureRef(cardRef, {
                            format: 'png',
                            quality: 1.0,
                            result: 'tmpfile',
                        });
                        console.log('📤 Share fallback image generated:', uri);
                    }
                }

                if (!uri) {
                    console.error('❌ No URI for sharing');
                    Alert.alert('Error', 'Failed to generate image for sharing');
                    return;
                }

                console.log('📤 Checking if sharing is available...');
                if (await Sharing.isAvailableAsync()) {
                    console.log('📤 Sharing is available, opening share dialog...');
                    await Sharing.shareAsync(uri);
                    console.log('✅ Share completed');
                } else {
                    console.log('❌ Sharing not available on device');
                    Alert.alert('Sharing not available', 'Sharing is not available on this device');
                }
            } catch (error) {
                console.error('❌ Error sharing image:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                Alert.alert('Error', `Failed to share image: ${errorMessage}`);
            } finally {
                setIsDownloading(false);
                console.log('📤 Share process completed');
            }
        };

        const handleCancel = useCallback(() => {
            handleClose();
        }, [handleClose]);

        // Cleanup on unmount
        useEffect(() => {
            return () => {
                if (imageUrl && imageUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(imageUrl);
                }
            };
        }, [imageUrl]);

        if (!history) return null;

        const isProfitable = history.pl !== undefined && history.pl > 0;

        // Server content rendering
        const renderServerContent = () => {
            if (isFetchingPLSS) {
                return (
                    <View className="flex-1 items-center justify-center py-8">
                        <ActivityIndicator size="large" color="#EC4899" />
                        <Text className="text-white text-sm mt-4">{t('Loading screenshot...')}</Text>
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
                            onError={(error) => {
                                console.error('Image loading error:', error);
                                setUseServerImage(false);
                            }}
                        />
                    </View>
                );
            }

            return (
                <View className="flex-1 items-center justify-center py-8">
                    <FileIcon size={40} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm mt-2">
                        {t('No image available')}
                    </Text>
                    <TouchableOpacity
                        className="mt-4 px-4 py-2 bg-gray-700 rounded-lg"
                        onPress={() => setUseServerImage(false)}
                    >
                        <Text className="text-white text-sm">
                            {t('Generate Local Screenshot')}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        };

        // Local content rendering with ViewShot wrapper
        const renderLocalContent = () => (
            <View className="flex-1 items-center justify-center mb-6">
                <View className="w-full p-3 relative">
                    <ViewShot
                        ref={cardRef}
                        options={{
                            format: 'png',
                            quality: 1.0,
                            result: 'tmpfile',
                        }}
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
                                    <Text className={`text-base font-InterSemiBold ${history.position_type === 'LONG' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {history.position_type}
                                    </Text>
                                </View>

                                <View className="flex-1 justify-center mt-6">
                                    <Text className="text-gray-300 text-sm font-InterRegular mb-1">
                                        {t('ROI')}
                                    </Text>
                                    <Text className={`text-4xl font-InterBold mb-4 ${isProfitable ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {(history.roi || 0).toFixed(2)}%
                                    </Text>

                                    <Text className="text-gray-300 text-sm font-InterSemiBold mb-1 mt-10">
                                        {t('Entry Price')}
                                    </Text>
                                    <Text className="text-white text-lg font-InterSemiBold mb-6">
                                        ${(history.entry || 0).toFixed(2)}
                                    </Text>

                                    <Text className="text-gray-300 text-sm font-InterSemiBold mb-1">
                                        {t('Exit Price')}
                                    </Text>
                                    <Text className="text-white text-lg font-InterSemiBold">
                                        ${('exit' in history ? (history.exit || 0).toFixed(2) : 'N/A')}
                                    </Text>

                                    <Text className="text-gray-300 text-sm font-InterSemiBold mb-1 mt-4">
                                        {t('P&L')}
                                    </Text>
                                    <Text className={`text-xl font-InterBold ${isProfitable ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        ${(history.pl || 0).toFixed(2)}
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
                    </ViewShot>
                </View>

                <TouchableOpacity
                    className="mt-4 px-4 py-2 bg-gray-700 rounded-lg"
                    onPress={() => setUseServerImage(true)}
                >
                    <Text className="text-white text-sm">{t('Use Server Screenshot')}</Text>
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
                onChange={handleSheetChanges}
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

                    {/* Action buttons with Download and Share */}
                    <View className="flex-row items-center justify-between mb-3 space-x-2">
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg border border-gray-700 items-center justify-center mr-2"
                            onPress={handleCancel}
                        >
                            <Text className="text-white font-InterBold">{t('Cancel')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg border items-center justify-center mr-2 ${isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS)
                                ? 'bg-gray-600 border-gray-600'
                                : 'bg-blue-600 border-blue-600'
                                }`}
                            onPress={handleShare}
                            disabled={isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS) || Platform.OS === 'web'}
                        >
                            <View className="flex-row items-center">
                                <Share2 size={16} color="#FFFFFF" />
                                <Text className="text-white font-InterBold ml-1">
                                    {Platform.OS === 'web' ? t('N/A') : t('Share')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg border items-center justify-center ${isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS)
                                ? 'bg-gray-600 border-gray-600'
                                : 'bg-primary-100 border-primary-100'
                                }`}
                            onPress={handleDownload}
                            disabled={isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS)}
                        >
                            <View className="flex-row items-center">
                                {isDownloading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 4 }} />}
                                <Download size={16} color="#FFFFFF" />
                                <Text className="text-white font-InterBold ml-1">
                                    {isDownloading ? t('Saving...') : t('Download')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View className="px-4 mt-4">
                        <Text className="text-gray-400 text-xs text-center">
                            {Platform.OS === 'android' 
                                ? t('Screenshot will be saved to your device storage')
                                : t('Screenshot will be saved to your {{location}}', {
                                    location: Platform.OS === 'ios' ? t('Photos') : t('Gallery')
                                })
                            }
                        </Text>
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);

ScreenShotBottomSheet.displayName = 'ScreenShotBottomSheet';
export default ScreenShotBottomSheet;