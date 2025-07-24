import { TouchableOpacity, View } from "react-native";
import React from "react";
import BrokerPLCard from "./BokerPLCard";
import images from "@/constants/images";
import PropFirmPLCard from "./PropFirmPLCard";
import { FundedAccountIcon } from "./icons/FundedAccountIcon";
import { EvaluatedAccountIcon } from "./icons/EvaluatedAccountIcon";

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
                   <PropFirmPLCard
                        account={account}
                        activeTab="Evaluation"
                        accountName={account.name}
                        accountBalance={`${account.currency || 'USD'} ${account.balance.toLocaleString()}`}
                        dailyPL={account.dailyPL}
                        icon={EvaluatedAccountIcon}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default ChallengeAccounts;