import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import PropFirmPLCard from './PropFirmPLCard';
import { EvaluatedAccountIcon } from './icons/EvaluatedAccountIcon';

interface PropFirmAccount {
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
}

interface ChallengeAccountsProps {
    accounts: PropFirmAccount[];
    onAccountPress: (account: PropFirmAccount) => void;
    // New props for current account and archive functionality
    currentAccountId?: number;
    onArchivePress?: (account: any) => void;
    context?: 'menu' | 'overview';
}

const ChallengeAccounts = ({
    accounts,
    onAccountPress,
    currentAccountId,
    onArchivePress,
    context = 'menu',
}: ChallengeAccountsProps) => {

    return (
        <View className="mt-2">
            {accounts.map((account: PropFirmAccount) => (
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
                        isCurrentAccount={currentAccountId === account.id}
                        onArchivePress={onArchivePress}
                        context={context}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default ChallengeAccounts;