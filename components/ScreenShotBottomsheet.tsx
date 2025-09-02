import BottomSheet, { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { X, Download, Share2 } from "lucide-react-native";
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, Dimensions, Platform, Alert, ActivityIndicator } from "react-native";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
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
        const [imageUrl, setImageUrl] = useState<string | null>(null);

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
            if (history && !plssData && currentUser) {
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
                                    }
                                };
                                reader.onerror = (error) => {
                                    console.error('FileReader error:', error);
                                };
                                reader.readAsDataURL(data);
                            } catch (error) {
                                console.error('Error processing server image:', error);
                            }
                        },
                        onError: (error) => {
                            console.error('Failed to fetch server screenshot:', error);
                        }
                    }
                );
            }
        }, [history, isHistory, backtesting, fetchPLSS, plssData, currentUser]);

        // Request permissions for MediaLibrary (iOS and Android)
        const requestPermissions = async (): Promise<boolean> => {
            console.log('🔐 Requesting permissions...');

            if (Platform.OS === 'web') {
                console.log('🌐 Web platform - no permissions needed');
                return true;
            }

            try {
                // Request MediaLibrary permissions
                const { status } = await MediaLibrary.requestPermissionsAsync();
                console.log('📱 MediaLibrary permission result:', status);

                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Required',
                        'Please grant permission to save images to your photo library'
                    );
                    return false;
                }

                return true;
            } catch (error) {
                console.error('❌ Error requesting permissions:', error);
                Alert.alert(
                    'Permission Error',
                    'Unable to request permissions. Please check your device settings.'
                );
                return false;
            }
        };

        // Save to gallery using MediaLibrary with better error handling
        const saveToGallery = async (uri: string): Promise<boolean> => {
            try {
                console.log('📱 Saving to gallery using MediaLibrary...');
                console.log('📱 URI to save:', uri);

                // Request permissions first
                const hasPermission = await requestPermissions();
                if (!hasPermission) {
                    return false;
                }

                // Convert data URL to asset if needed
                let finalUri = uri;
                if (uri.startsWith('data:')) {
                    console.log('📱 Converting data URL to file...');
                    const fileName = `trading-screenshot-${Date.now()}.png`;
                    const fileUri = FileSystem.documentDirectory + fileName;

                    // Extract base64 data
                    const base64Data = uri.split(',')[1];

                    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    finalUri = fileUri;
                    console.log('📱 Converted to file URI:', finalUri);
                }

                // Create asset in MediaLibrary
                const asset = await MediaLibrary.createAssetAsync(finalUri);
                console.log('📱 Asset created:', asset.id);

                console.log('✅ Successfully saved to gallery');
                return true;

            } catch (error) {
                console.error('❌ Error saving to gallery:', error);

                // More specific error handling
                if (error.message?.includes('permission')) {
                    Alert.alert(
                        'Permission Error',
                        'Unable to save image. Please check app permissions in settings.'
                    );
                } else if (error.message?.includes('not found') || error.message?.includes('file')) {
                    Alert.alert(
                        'File Error',
                        'Unable to access the image file. Please try generating a new screenshot.'
                    );
                } else {
                    Alert.alert(
                        'Save Error',
                        `Failed to save image to gallery: ${error.message || 'Unknown error'}`
                    );
                }

                return false;
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

        // Generate image URI for sharing/saving - only server image
        const generateImageUri = async (): Promise<string | null> => {
            try {
                if (imageUrl) {
                    console.log('📸 Using server image');
                    return imageUrl;
                } else {
                    console.error('❌ No server image available');
                    Alert.alert('Error', 'Screenshot not ready. Please wait for it to load.');
                    return null;
                }
            } catch (error) {
                console.error('❌ Error getting image URI:', error);
                return null;
            }
        };

        // Main download function
        const handleDownload = async () => {
            console.log('📸 Starting download process...');
            console.log('📸 Platform:', Platform.OS);

            try {
                setIsDownloading(true);

                const uri = await generateImageUri();
                if (!uri) {
                    Alert.alert('Error', 'Failed to generate image');
                    return;
                }

                console.log('📸 Generated URI:', uri);

                // Platform-specific saving
                if (Platform.OS === 'web') {
                    downloadForWeb(uri);
                } else {
                    const saveSuccess = await saveToGallery(uri);
                    if (saveSuccess) {
                        console.log('✅ Download completed successfully');
                        Alert.alert('Success', 'Trading screenshot saved to gallery!');
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

        // Share function using Expo Sharing with better error handling
        const handleShare = async () => {
            if (Platform.OS === 'web') {
                Alert.alert('Not Available', 'Sharing is not available on web. Use the download button instead.');
                return;
            }

            console.log('📤 Starting share process...');

            try {
                setIsDownloading(true);

                const uri = await generateImageUri();
                if (!uri) {
                    Alert.alert('Error', 'Failed to generate image for sharing');
                    return;
                }

                console.log('📤 Sharing image URI:', uri);

                // Convert data URL to file if needed for sharing
                let shareUri = uri;
                if (uri.startsWith('data:')) {
                    console.log('📤 Converting data URL to file for sharing...');
                    const fileName = `trading-summary-${Date.now()}.png`;
                    const fileUri = FileSystem.documentDirectory + fileName;

                    // Extract base64 data
                    const base64Data = uri.split(',')[1];

                    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    shareUri = fileUri;
                    console.log('📤 Converted to file URI for sharing:', shareUri);
                }

                console.log('📤 Checking if sharing is available...');
                if (await Sharing.isAvailableAsync()) {
                    console.log('📤 Sharing is available, opening share dialog...');
                    await Sharing.shareAsync(shareUri, {
                        mimeType: 'image/png',
                        dialogTitle: 'Share Trading Summary'
                    });
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

        // Server content rendering - only show loading or image
        const renderServerContent = () => {
            if (isFetchingPLSS || !imageUrl) {
                return (
                    <View className="flex-1 items-center justify-center py-8">
                        <ActivityIndicator size="large" color="#EC4899" />
                    </View>
                );
            }

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
                            // Keep trying to load server image, don't fallback
                        }}
                    />
                </View>
            );
        };

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

                    {/* Content - only server content */}
                    {renderServerContent()}

                    {/* Action buttons - only show when image is ready */}
                    {imageUrl && (
                        <View>
                            <View className="flex-row items-center justify-between mb-3 space-x-2">
                                <TouchableOpacity
                                    className={`flex-1 py-3 rounded-lg border items-center justify-center mr-2 ${isDownloading
                                        ? 'bg-gray-600 border-gray-600'
                                        : 'border-primary-100'
                                        }`}
                                    onPress={handleShare}
                                    disabled={isDownloading || Platform.OS === 'web'}
                                >
                                    <View className="flex-row items-center">
                                        <Share2 size={16} color="#E74694" />
                                        <Text className="text-primary-100 font-InterBold ml-1">
                                            {Platform.OS === 'web' ? t('N/A') : t('Share')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`flex-1 py-3 rounded-lg border items-center justify-center ${isDownloading
                                        ? 'bg-gray-600 border-gray-600'
                                        : 'bg-primary-100 border-primary-100'
                                        }`}
                                    onPress={handleDownload}
                                    disabled={isDownloading}
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
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-lg border border-gray-700 items-center justify-center mr-2"
                                onPress={handleCancel}
                            >
                                <Text className="text-white font-InterBold">{t('Cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);

ScreenShotBottomSheet.displayName = 'ScreenShotBottomSheet';
export default ScreenShotBottomSheet;