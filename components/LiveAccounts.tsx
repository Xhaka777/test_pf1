import React from "react";
import { TouchableOpacity, View } from "react-native";
import BrokerPLCard from "./BokerPLCard";
import icons from "@/constants/icons";

interface LiveAccountsProps {
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

const LiveAccounts = ({
    accounts,
    onAccountPress
}: LiveAccountsProps) => {

    return (
        <View className="mt-2">
            {accounts.map((account) => (
                <TouchableOpacity
                    key={account.id}
                    onPress={() => onAccountPress(account)}
                >
                    <BrokerPLCard
                        account={account}
                        activeTab='Live'
                        tabImage={icons.red_wallet}
                        accountName={account.name}
                        accountBalance={`${account.currency || 'USD'} ${account.balance.toLocaleString()}`}
                        dailyPL={account.dailyPL}

                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default LiveAccounts;