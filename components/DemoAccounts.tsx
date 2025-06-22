import React from "react";
import { TouchableOpacity, View } from "react-native";
import BrokerPLCard from "./BokerPLCard";
import icons from "@/constants/icons";

interface DemoAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: string;
        dailyPL: string;
        changePercentage: string;
    }>,
    onAccountPress: (account: any) => void;
}

const DemoAccounts = ({ accounts, onAccountPress }: DemoAccountsProps) => {

    console.log('po hin qitu...');
    console.log('DemoAccounts', accounts)
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
                        activeTab="Demo"
                        tabImage={icons.wallet}
                        accountName={account.name}
                        accountBalance={account.balance}
                        dailyPL={account.dailyPL}
                    //    {/* onAccountPress={onAccountPress}/> */}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default DemoAccounts;
