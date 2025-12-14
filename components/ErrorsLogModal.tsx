import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    Animated,
    Dimensions
} from 'react-native';
import { getErrorLogs, clearErrorLogs, ErrorLog } from '../utils/logger';
import { useUser } from '@clerk/clerk-expo';
import { DeviceEventEmitter } from 'react-native';
import SearchInput from './SearchInput';
import { X } from 'lucide-react-native';

interface ErrorLogsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const { width } = Dimensions.get('window');

export function ErrorLogsModal({ open, onOpenChange }: ErrorLogsModalProps) {
    const { user } = useUser();
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'errors' | 'logs'>('all');
    const [slideAnim] = useState(new Animated.Value(width));

    const loadLogs = async () => {
        try {
            const errorLogs = await getErrorLogs(user?.id);
            setLogs(errorLogs);
        } catch (error) {
            console.error('Failed to load error logs:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLogs();
        setRefreshing(false);
    };

    const handleClearLogs = () => {
        Alert.alert(
            'Clear Logs',
            'Are you sure you want to clear all logs?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearErrorLogs(user?.id);
                            setLogs([]);
                            // Note: SearchInput component manages its own state
                            // so we don't need to reset searchQuery here
                        } catch (error) {
                            console.error('Failed to clear logs:', error);
                        }
                    }
                }
            ]
        );
    };

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onOpenChange(false);
        });
    };

    const filteredLogs = useMemo(() => {
        let filtered = logs;

        // Filter by type
        if (filterType === 'errors') {
            // Show items with type 'error' OR undefined (backward compatibility)
            filtered = filtered.filter(
                (log) => log.type === 'error' || log.type === undefined,
            );
        } else if (filterType === 'logs') {
            filtered = filtered.filter((log) => log.type === 'log');
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (log) =>
                    log.title.toLowerCase().includes(query) ||
                    log.description.toLowerCase().includes(query),
            );
        }

        return filtered;
    }, [logs, searchQuery, filterType]);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    useEffect(() => {
        if (open) {
            loadLogs();
            // Animate in from rightsssss
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Reset animation value when closed
            slideAnim.setValue(width);
        }
    }, [open, user?.id]);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('error-logs-updated', loadLogs);
        return () => subscription.remove();
    }, [user?.id]);

    return (
        <Modal
            visible={open}
            animationType="none"
            presentationStyle="overFullScreen"
            transparent={true}
            onRequestClose={closeModal}
        >
            <View className="flex-1 bg-propfirmone-main">
                {/* Background overlay */}
                <TouchableOpacity
                    className="flex-1 bg-propfirmone-main"
                    activeOpacity={1}
                    onPress={closeModal}
                />

                {/* Sliding panel */}
                <Animated.View
                    className="absolute right-0 top-0 bottom-0 bg-propfirmone-main"
                    style={{
                        width: width,
                        transform: [{ translateX: slideAnim }],
                    }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4 pt-12">
                        <Text className="text-white text-lg font-semibold">
                            Logs & Errors
                        </Text>
                        <TouchableOpacity
                            onPress={closeModal}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            {/* <Text className="text-blue-500 text-lg">✕</Text> */}
                            <X size={20} color={'#ffffff'} />
                        </TouchableOpacity>
                    </View>

                    {/* Filter and Clear Section */}
                    <View className="p-4 space-y-4">
                        {/* Filter Toggle Group */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row bg-[#1a1819] rounded-lg p-1">
                                <TouchableOpacity
                                    className={`px-4 py-3 rounded-md ${filterType === 'all' ? 'bg-[#0f0e0f]' : ''}`}
                                    onPress={() => setFilterType('all')}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm ${filterType === 'all' ? 'text-white' : 'text-gray-400'}`}>
                                        All
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`px-4 py-3 rounded-md ${filterType === 'errors' ? 'bg-gray-700' : ''}`}
                                    onPress={() => setFilterType('errors')}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm ${filterType === 'errors' ? 'text-white' : 'text-gray-400'}`}>
                                        Errors
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`px-4 py-3 rounded-md ${filterType === 'logs' ? 'bg-gray-700' : ''}`}
                                    onPress={() => setFilterType('logs')}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm ${filterType === 'logs' ? 'text-white' : 'text-gray-400'}`}>
                                        Logs
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Clear Button */}
                            {logs.length > 0 && (
                                <TouchableOpacity
                                    className="bg-gray-800 px-3 py-2 rounded-lg border border-gray-600"
                                    onPress={handleClearLogs}
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-red-400 text-sm">🗑️ Clear logs</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Search Input */}
                        <SearchInput onSearch={setSearchQuery} />
                    </View>

                    {/* Logs Content */}
                    <ScrollView
                        className="flex-1 px-4"
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {filteredLogs.length === 0 ? (
                            <View className="flex-1 justify-center items-center py-20">
                                <Text className="text-gray-400 text-center">
                                    {logs.length === 0 ? 'No error logs yet' : 'No logs match your search'}
                                </Text>
                            </View>
                        ) : (
                            <View className="space-y-3 pb-6">
                                {filteredLogs.map((log) => {
                                    const isError = log.type === 'error' || log.type === undefined;
                                    return (
                                        <View
                                            key={log.id}
                                            className={`bg-gray-800 p-4 rounded-lg border ${isError ? 'border-red-500/50' : 'border-gray-600'
                                                }`}
                                        >
                                            <View className="flex-row justify-between items-start mb-2">
                                                <Text
                                                    className={`font-medium text-sm flex-1 mr-2 ${isError ? 'text-red-400' : 'text-white'
                                                        }`}
                                                >
                                                    {log.title}
                                                </Text>
                                                <Text className="text-gray-500 text-xs">
                                                    {formatTimestamp(log.timestamp)}
                                                </Text>
                                            </View>
                                            {log.description && (
                                                <Text className="text-gray-300 text-sm">
                                                    {log.description}
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}