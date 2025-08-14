// components/ScreenShotBottomSheet.tsx - Debugged version with enhanced error handling
import BottomSheet, { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { FileIcon, X, Download, Share2 } from "lucide-react-native";
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, ImageBackground, Dimensions, Platform, PermissionsAndroid, Alert, ActivityIndicator } from "react-native";
import SelectableButton from "./SelectableButton";
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import images from "@/constants/images";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import ViewShot from 'react-native-view-shot';
import { OpenTradesData } from "@/api/schema";
import { TradeHistoryData } from "@/api/schema/trade-history";
import { TradeSummary } from "@/api/schema/metrics";
import { useFetchPLSSMutation } from "@/api/hooks/trade-service";
import { useGetCurrentUser } from "@/api/hooks/auth";
import { useTranslation } from 'react-i18next';

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
                // Only try to fetch server image for real data, not mock data
                const isMockData = history.order_id && history.order_id.toString().startsWith('MOCK_');
                
                if (!isMockData) {
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
                                // Enhanced blob to base64 conversion with better error handling
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
                                // Fallback to local generation
                                setUseServerImage(false);
                            }
                        }
                    );
                } else {
                    // For mock data, skip server fetch and use local generation
                    console.log('🧪 [MOCK] Skipping server screenshot for mock data');
                    setUseServerImage(false);
                }
            }
        }, [history, isHistory, backtesting, fetchPLSS, plssData, currentUser, useServerImage]);

        // Enhanced permission request with timeout and better Android 13+ handling
        const requestPermissions = async (): Promise<boolean> => {
            console.log('🔐 Requesting permissions...');
            
            if (Platform.OS === 'web') {
                console.log('🌐 Web platform - no permissions needed');
                return true;
            }

            try {
                if (Platform.OS === 'android') {
                    const androidVersion = Platform.Version as number;
                    console.log('📱 Android version:', androidVersion);

                    if (androidVersion >= 33) {
                        // Android 13+ - For saving images, we actually don't need special permissions
                        // MediaLibrary.createAssetAsync works without explicit permissions on Android 13+
                        console.log('📱 Android 13+ - Using MediaLibrary permissions instead');
                        const { status } = await MediaLibrary.requestPermissionsAsync();
                        console.log('📱 MediaLibrary permission result:', status);
                        return status === 'granted';
                    } else {
                        // Android 12 and below - use legacy permissions
                        console.log('📱 Android 12 and below - requesting WRITE_EXTERNAL_STORAGE permission');
                        
                        // Add timeout to prevent hanging
                        const permissionPromise = PermissionsAndroid.request(
                            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                            {
                                title: 'Storage Permission',
                                message: 'This app needs access to save images to your gallery',
                                buttonNeutral: 'Ask Me Later',
                                buttonNegative: 'Cancel',
                                buttonPositive: 'OK',
                            }
                        );

                        const timeoutPromise = new Promise<string>((_, reject) => {
                            setTimeout(() => reject(new Error('Permission request timeout')), 10000);
                        });

                        const granted = await Promise.race([permissionPromise, timeoutPromise]);
                        console.log('📱 WRITE_EXTERNAL_STORAGE permission result:', granted);
                        return granted === PermissionsAndroid.RESULTS.GRANTED;
                    }
                } else {
                    // iOS - use MediaLibrary permissions
                    console.log('🍎 iOS - requesting MediaLibrary permissions');
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    console.log('🍎 MediaLibrary permission result:', status);
                    return status === 'granted';
                }
            } catch (error) {
                console.error('❌ Error requesting permissions:', error);
                
                // On Android 13+, if permission fails, try without explicit permission
                if (Platform.OS === 'android' && Platform.Version >= 33) {
                    console.log('📱 Android 13+ - Attempting to save without explicit permission');
                    return true; // Let MediaLibrary handle it
                }
                
                return false;
            }
        };

        // Download function for web platform
        const downloadForWeb = (uri: string) => {
            try {
                console.log('🌐 Starting web download...');
                // Create a temporary link element for web download
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

        // Enhanced download function with detailed debugging
        const handleDownload = async () => {
            console.log('📸 Starting download process...');
            console.log('📸 useServerImage:', useServerImage);
            console.log('📸 imageUrl available:', !!imageUrl);
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
                        // Use the ViewShot capture method with detailed options
                        console.log('📸 Calling ViewShot.capture...');
                        uri = await cardRef.current.capture({
                            format: 'png',
                            quality: 1.0,
                            result: 'tmpfile',
                        });
                        console.log('📸 ViewShot capture result:', uri);
                    } catch (captureError) {
                        console.error('❌ ViewShot capture error:', captureError);
                        
                        // Fallback: try using captureRef
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

                if (Platform.OS === 'web') {
                    console.log('🌐 Platform is web, using web download');
                    downloadForWeb(uri);
                } else {
                    console.log('📱 Platform is mobile, saving to gallery');
                    
                    // Request permissions
                    const hasPermission = await requestPermissions();
                    console.log('🔐 Permission granted:', hasPermission);
                    
                    if (!hasPermission) {
                        Alert.alert('Permission Required', 'Please grant permission to save images to your device');
                        return;
                    }

                    console.log('💾 Creating asset in MediaLibrary...');
                    
                    try {
                        // Debug the URI and MediaLibrary
                        console.log('💾 URI type:', typeof uri);
                        console.log('💾 URI value:', uri);
                        console.log('💾 MediaLibrary available methods:', Object.keys(MediaLibrary));
                        
                        // Try different approaches for saving the image
                        let asset;
                        
                        try {
                            // Method 1: Use saveToLibraryAsync instead of createAssetAsync
                            console.log('💾 Method 1: Using saveToLibraryAsync...');
                            await MediaLibrary.saveToLibraryAsync(uri);
                            console.log('💾 Method 1 success: Image saved to library');
                            
                            // Success! No need to continue to other methods
                            console.log('✅ Download completed successfully');
                            Alert.alert('Success', 'Trading screenshot saved to your gallery!');
                            return;
                            
                        } catch (method1Error) {
                            console.log('💾 Method 1 failed:', method1Error.message);
                            
                            try {
                                // Method 2: Use deprecated createAssetAsync syntax (without await in case of sync call)
                                console.log('💾 Method 2: Trying createAssetAsync without await...');
                                const result = MediaLibrary.createAssetAsync(uri);
                                console.log('💾 Method 2 result type:', typeof result);
                                
                                if (result && typeof result.then === 'function') {
                                    // It's a promise
                                    asset = await result;
                                    console.log('💾 Method 2 promise success:', asset);
                                } else {
                                    // It's synchronous
                                    asset = result;
                                    console.log('💾 Method 2 sync success:', asset);
                                }
                            } catch (method2Error) {
                                console.log('💾 Method 2 failed:', method2Error.message);
                                
                                try {
                                    // Method 3: Copy file to a different location and try saveToLibraryAsync
                                    console.log('💾 Method 3: Copy and use saveToLibraryAsync...');
                                    const fileName = `trading-screenshot-${Date.now()}.png`;
                                    const tempUri = `${FileSystem.documentDirectory}${fileName}`;
                                    
                                    console.log('💾 Copying from:', uri);
                                    console.log('💾 Copying to:', tempUri);
                                    
                                    await FileSystem.copyAsync({
                                        from: uri,
                                        to: tempUri
                                    });
                                    
                                    console.log('💾 File copied, now using saveToLibraryAsync...');
                                    await MediaLibrary.saveToLibraryAsync(tempUri);
                                    console.log('💾 Method 3 success with saveToLibraryAsync');
                                    
                                    // Clean up temp file
                                    try {
                                        await FileSystem.deleteAsync(tempUri);
                                        console.log('💾 Temp file cleaned up');
                                    } catch (cleanupError) {
                                        console.log('💾 Cleanup warning:', cleanupError.message);
                                    }
                                    
                                    console.log('✅ Download completed successfully');
                                    Alert.alert('Success', 'Trading screenshot saved to your gallery!');
                                    return;
                                    
                                } catch (method3Error) {
                                    console.log('💾 Method 3 failed:', method3Error.message);
                                    
                                    try {
                                        // Method 4: Try using FileSystem to move to Downloads or Pictures directory
                                        console.log('💾 Method 4: Direct file system approach...');
                                        
                                        // For Android, try saving to the Downloads directory
                                        if (Platform.OS === 'android') {
                                            const downloadsDir = FileSystem.documentDirectory + 'Download/';
                                            
                                            // Ensure Downloads directory exists
                                            const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
                                            if (!dirInfo.exists) {
                                                await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
                                            }
                                            
                                            const finalPath = downloadsDir + `trading-screenshot-${Date.now()}.png`;
                                            await FileSystem.copyAsync({
                                                from: uri,
                                                to: finalPath
                                            });
                                            
                                            console.log('💾 Method 4 success: File saved to Downloads');
                                            Alert.alert('Success', 'Trading screenshot saved to Downloads folder!');
                                            return;
                                        }
                                    } catch (method4Error) {
                                        console.log('💾 Method 4 failed:', method4Error.message);
                                        throw new Error(`All save methods failed. Last error: ${method4Error.message}`);
                                    }
                                }
                            }
                        }
                        
                        // If we got here with an asset from createAssetAsync, try album operations
                        if (asset) {
                            console.log('💾 Asset created successfully:', asset.id);
                            
                            // Try to create album, but don't fail if it doesn't work
                            try {
                                console.log('📁 Attempting album operations...');
                                const album = await MediaLibrary.getAlbumAsync('Trading App');
                                if (album) {
                                    console.log('📁 Album exists, adding asset...');
                                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                                } else {
                                    console.log('📁 Creating new album...');
                                    await MediaLibrary.createAlbumAsync('Trading App', asset, false);
                                }
                                console.log('📁 Album operation completed');
                            } catch (albumError) {
                                console.warn('⚠️ Album operation failed, but asset was saved:', albumError);
                                // Don't throw here, the image was still saved
                            }
                            
                            console.log('✅ Download completed successfully');
                            Alert.alert('Success', 'Trading screenshot saved to your gallery!');
                        }
                        
                    } catch (mediaError) {
                        console.error('❌ Final MediaLibrary error:', mediaError);
                        throw new Error(`Failed to save to gallery: ${mediaError.message}`);
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

        // Enhanced share function with debugging
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
                        // Try fallback
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

        // Enhanced cleanup on unmount
        useEffect(() => {
            return () => {
                if (imageUrl && imageUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(imageUrl);
                }
            };
        }, [imageUrl]);

        if (!history) return null;

        const isProfitable = history.pl !== undefined && history.pl > 0;
        const isMockData = history.order_id && history.order_id.toString().startsWith('MOCK_');

        // Enhanced server content rendering
        const renderServerContent = () => {
            if (isFetchingPLSS && !isMockData) {
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
                        {isMockData ? t('🧪 Mock data - No server image') : t('No image available')}
                    </Text>
                    <TouchableOpacity
                        className="mt-4 px-4 py-2 bg-gray-700 rounded-lg"
                        onPress={() => setUseServerImage(false)}
                    >
                        <Text className="text-white text-sm">
                            {isMockData ? t('🧪 Generate Mock Screenshot') : t('Generate Local Screenshot')}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        };

        // Enhanced local content rendering with ViewShot wrapper
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
                                {/* Mock data indicator */}
                                {isMockData && (
                                    <View className="absolute top-2 right-2 bg-yellow-500 px-2 py-1 rounded-md z-10">
                                        <Text className="text-black text-xs font-bold">🧪 MOCK</Text>
                                    </View>
                                )}

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

                {!isMockData && (
                    <TouchableOpacity
                        className="mt-4 px-4 py-2 bg-gray-700 rounded-lg"
                        onPress={() => setUseServerImage(true)}
                    >
                        <Text className="text-white text-sm">{t('Use Server Screenshot')}</Text>
                    </TouchableOpacity>
                )}
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
                            {t('P/L Screenshot')} {isMockData && <Text className="text-yellow-400">🧪</Text>}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Dynamic content based on mode */}
                    {useServerImage ? renderServerContent() : renderLocalContent()}

                    {/* Enhanced action buttons with Download and Share */}
                    <View className="flex-row items-center justify-between mb-3 space-x-2">
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg border border-gray-700 items-center justify-center mr-2"
                            onPress={handleCancel}
                        >
                            <Text className="text-white font-InterBold">{t('Cancel')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg border items-center justify-center mr-2 ${isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS && !isMockData)
                                ? 'bg-gray-600 border-gray-600'
                                : 'bg-blue-600 border-blue-600'
                                }`}
                            onPress={handleShare}
                            disabled={isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS && !isMockData) || Platform.OS === 'web'}
                        >
                            <View className="flex-row items-center">
                                <Share2 size={16} color="#FFFFFF" />
                                <Text className="text-white font-InterBold ml-1">
                                    {Platform.OS === 'web' ? t('N/A') : t('Share')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg border items-center justify-center ${isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS && !isMockData)
                                ? 'bg-gray-600 border-gray-600'
                                : 'bg-primary-100 border-primary-100'
                                }`}
                            onPress={handleDownload}
                            disabled={isDownloading || (useServerImage && !imageUrl && !isFetchingPLSS && !isMockData)}
                        >
                            <View className="flex-row items-center">
                                {isDownloading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 4 }} />}
                                <Download size={16} color="#FFFFFF" />
                                <Text className="text-white font-InterBold ml-1">
                                    {isDownloading 
                                        ? (isMockData ? t('🧪 Saving...') : t('Saving...'))
                                        : (isMockData ? t('🧪 Download') : t('Download'))
                                    }
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View className="px-4 mt-4">
                        <Text className="text-gray-400 text-xs text-center">
                            {isMockData && <Text className="text-yellow-400">🧪 {t('Mock data')} - </Text>}
                            {t('Screenshot will be saved to your {{location}}', {
                                location: Platform.OS === 'ios' ? t('Photos') : t('Gallery')
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