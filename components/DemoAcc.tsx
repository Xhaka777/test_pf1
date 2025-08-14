import React from "react";
import { View, Text, TouchableOpacity } from 'react-native';

interface DemoAccProps {
    name: string;
    id: string;
    amount: string;
    status: string;
    onDemoPress: () => void;
}

const DemoAcc = ({ name, id, amount, status, onDemoPress }: DemoAccProps) => {
    return (
        <TouchableOpacity
            className="bg-[#252223] p-4 rounded-xl"
            onPress={onDemoPress}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <View className="bg-propfirmone-200 border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4">
                        <Text className="text-white text-lg font-bold">NE</Text>
                    </View>

                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <Text className="text-white text-lg font-medium">{name}</Text>
                        </View>
                        <View className="mt-1">
                            <Text className="text-white text-sm opacity-80">ID: {id}</Text>
                        </View>

                        <View className="mt-1 flex-row">
                            <Text className="text-white text-base font-medium">${amount}</Text>
                            <Text className="text-success-400 text-base ml-2">N/A</Text>
                        </View>
                    </View>
                </View>

                <View className="flex-row items-center ml-4">
                    <View className="bg-success-800 rounded-md px-1">
                        <Text className="text-success-400 font-medium px-1">{status}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default DemoAcc;