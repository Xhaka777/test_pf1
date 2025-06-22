import { TouchableOpacity, View } from "react-native";
import React from "react";
import BrokerPLCard from "./BokerPLCard";
import images from "@/constants/images";

interface ChallengeAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: string;
        dailyPL: string;
        changePercentage: string;
    }>,
    onAccountPress: (account: any) => void;
}

const ChallengeAccounts = ({
    accounts,
    onAccountPress
}: ChallengeAccountsProps) => {

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
                        activeTab="Challenge"
                        tabImage={images.alpha_capital}
                        accountName={account.name}
                        accountBalance={account.balance}
                        dailyPL={account.dailyPL}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default ChallengeAccounts;