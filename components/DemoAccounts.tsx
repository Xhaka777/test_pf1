import React from "react";
import { Pressable, TouchableOpacity, View } from "react-native";
import BrokerPLCard from "./BokerPLCard";
import icons from "@/constants/icons";
import BrokeragePracticePLCard from "./BokerPLCard";
import { PracticeIcon } from "./icons/PracticeIcon";

interface DemoAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: number;
        dailyPL: number;
        changePercentage: number;
        type?: 'Live' | 'Demo';
        currency?: string;
        firm?: string | null;
        exchange?: string;
        server?: string;
        status?: string;
        totalPL?: number;
        startingBalance?: number;
        originalData?: any;

    }>,
    onAccountPress: (account: any) => void;
}

const DemoAccounts = ({ accounts, onAccountPress }: DemoAccountsProps) => {

    const handleAccountPress = (account: any) => {
        console.log('[DemoAccounts] Account pressed - Full area touch:', {
            id: account.id,
            name: account.name,
            type: account.type || 'Demo'
        });

        // Call parent handler immediately
        onAccountPress(account);
    };

    return (
        <View className="mt-2">
        {accounts.map((account) => (
            <Pressable
                key={account.id}
                onPress={() => handleAccountPress(account)}
                style={({ pressed }) => [
                    {
                        opacity: pressed ? 0.7 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                    }
                ]}
            >
                <BrokeragePracticePLCard
                    account={account}
                    activeTab="Demo"
                    accountName={account.name}
                    accountBalance={`${account.currency || 'USD'} ${account.balance.toLocaleString()}`}
                    dailyPL={account.dailyPL}
                    icon={PracticeIcon}
                    onPress={null} 
                />
            </Pressable>
        ))}
    </View>
    )
}

export default DemoAccounts;
