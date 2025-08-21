import { TouchableOpacity, View } from "react-native";
import React from "react";
import PropFirmPLCard from "./PropFirmPLCard";
import { EvaluatedAccountIcon } from "./icons/EvaluatedAccountIcon";

interface ChallengeAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: number;
        dailyPL: number;
        changePercentage: number;
        type?: 'Challenge' | 'Funded';
        currency?: string;
        firm?: string;
        program?: string;
        totalPL?: number;
        netPL?: number;
        startingBalance?: number;
        maxTotalDD?: number;
        profitTarget?: number;
        originalData?: any;
    }>,
    onAccountPress: (account: any) => void;
}

// interface ChallengeAccountsProps {
//     accounts: PropFirmAccount[];
//     onAccountPress: (account: PropFirmAccount) => void;
// }

const ChallengeAccounts = ({
    accounts,
    onAccountPress
}: ChallengeAccountsProps) => {

    return (
        <View className="mt-2">
            {accounts.map((account) => (
                <TouchableOpacity
                    key={account.id}
                    onPress={() => onAccountPress(account)}
                >
                    <PropFirmPLCard
                        account={account}
                        activeTab="Challenge"
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