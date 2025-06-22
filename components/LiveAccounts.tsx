import React from "react";
import { TouchableOpacity, View } from "react-native";
import BrokerPLCard from "./BokerPLCard";
import icons from "@/constants/icons";

interface LiveAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: string;
        dailyPL: string;
        changePercentage: string;
    }>,
    onAccountPress: (account: any) => void;}

const LiveAccounts = ({
    accounts,
    onAccountPress
}: LiveAccountsProps) => {

    return (
        <View className="mt-2">
            {accounts.map((account: any) => (
                <TouchableOpacity
                    key={account.id}
                    onPress={() => onAccountPress(account)}
                >
                    <BrokerPLCard
                        key={account.id}
                        account={account}
                        activeTab='Live'
                        tabImage={icons.red_wallet}
                        accountName={account.name}
                        accountBalance={account.balance}
                        dailyPL={account.dailyPL}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default LiveAccounts;