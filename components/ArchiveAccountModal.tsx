import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import { Archive, Check, ChevronDown, X } from 'lucide-react-native';
import { AccountStatusEnum } from '@/shared/enums';

interface ArchiveAccountModalProps {
    onArchive: (
        status:
            | AccountStatusEnum.PASSED
            | AccountStatusEnum.FAILED
            | AccountStatusEnum.DISCONNECTED
            | AccountStatusEnum.SUBSCRIPTION_ENDED,
    ) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ArchiveAccountModal({
    onArchive,
    open,
    onOpenChange,
}: ArchiveAccountModalProps) {
    const [selectedArchiveStatus, setSelectedArchiveStatus] = useState<
        | AccountStatusEnum.PASSED
        | AccountStatusEnum.FAILED
        | AccountStatusEnum.DISCONNECTED
        | AccountStatusEnum.SUBSCRIPTION_ENDED
    >(AccountStatusEnum.PASSED);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleArchive = () => {
        onArchive(selectedArchiveStatus);
        setDropdownOpen(false);
    };

    const handleClose = () => {
        setDropdownOpen(false);
        onOpenChange?.(false);
    };

    const statusOptions = [
        { value: AccountStatusEnum.PASSED, label: 'Passed' },
        { value: AccountStatusEnum.FAILED, label: 'Failed' },
        { value: AccountStatusEnum.DISCONNECTED, label: 'Disconnected' },
        { value: AccountStatusEnum.SUBSCRIPTION_ENDED, label: 'Subscription Ended' },
    ];

    const selectedOption = statusOptions.find(option => option.value === selectedArchiveStatus);

    const handleStatusSelect = (status: typeof selectedArchiveStatus) => {
        setSelectedArchiveStatus(status);
        setDropdownOpen(false);
    };

    return (
        <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View className="flex-1 bg-black/70 justify-center items-center px-5">
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View className="bg-propfirmone-300 rounded-xl w-full max-w-md relative border-[0.5px] border-[#2F2C2D]">

                            {/* Header */}
                            <View className="p-3">
                                <View className="flex-row justify-between items-center ">
                                    <Text className="text-white text-xl font-InterBold">Archive Account</Text>
                                    <TouchableOpacity onPress={handleClose} className="p-1">
                                        <X size={24} color="#9ca3af" />
                                    </TouchableOpacity>
                                </View>

                                {/* Description */}
                                <Text className="text-[#C3C1C1] text-base text-InterSemiBold leading-6">
                                    Select the status for archiving this account. This will move the account to inactive accounts.
                                </Text>
                            </View>

                            {/* Divider */}
                            <View className="h-px bg-[#2F2C2D]" />
                            {/* Status Section */}
                            <View className="p-3 relative">
                                <Text className="text-white text-base font-InterSemiBold mb-3">Status</Text>

                                <TouchableOpacity
                                    className="bg-propfirmone-200 rounded-lg p-4 flex-row justify-between items-center border border-[#2F2C2D]"
                                    onPress={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <Text className="text-white text-Inter">{selectedOption?.label}</Text>
                                    <ChevronDown
                                        size={20}
                                        color="#9ca3af"
                                        style={{
                                            transform: [{ rotate: dropdownOpen ? '180deg' : '0deg' }]
                                        }}
                                    />
                                </TouchableOpacity>

                                {dropdownOpen && (
                                    <View className="absolute top-full left-4 right-4 bg-gray-700 rounded-lg mt-3 border border-propfirmone-200 z-50 overflow-hidden">
                                        {statusOptions.map((option, index) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                className={`p-4 flex-row items-center ${index === statusOptions.length - 1 
                                                    } ${selectedArchiveStatus === option.value ? 'bg-propfirmone-200' : 'bg-propfirmone-300'
                                                    }`}
                                                onPress={() => handleStatusSelect(option.value)}
                                            >
                                                {selectedArchiveStatus === option.value && (
                                                    <Check size={18} color="#ffffff" />
                                                )}
                                                <Text className={`text-base ${selectedArchiveStatus === option.value
                                                        ? 'text-white font-semibold ml-1'
                                                        : 'text-gray-300'
                                                    }`}>
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                            </View>

                            {/* Divider */}
                            <View className="h-px bg-[#2F2C2D]" />

                            {/* Buttons */}
                            <View className="p-3 flex-row">
                                <TouchableOpacity
                                    className="bg-transparent border border-[#2F2C2D] rounded-lg py-3 px-6 mr-12"
                                    onPress={handleClose}
                                >
                                    <Text className="text-white text-base font-InterSemiBold">Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="flex-1 bg-primary-100 rounded-lg py-3 ml-12 items-center"
                                    onPress={handleArchive}
                                >
                                    <Text className="text-white text-base font-InterSemiBold">Archive Account</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}