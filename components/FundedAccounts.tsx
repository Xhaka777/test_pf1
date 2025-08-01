import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import PropFirmPLCard from './PropFirmPLCard';
import { FundedAccountIcon } from './icons/FundedAccountIcon';

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

interface FundedAccountsProps {
    accounts: PropFirmAccount[];
    onAccountPress: (account: PropFirmAccount) => void;
}

const FundedAccounts = ({
    accounts,
    onAccountPress
}: FundedAccountsProps) => {

    return (
        <View className="mt-2">
            {accounts.map((account: PropFirmAccount) => (
                <TouchableOpacity
                    key={account.id}
                    onPress={() => onAccountPress(account)}
                >
                    <PropFirmPLCard
                        account={account}
                        activeTab="Funded"
                        accountName={account.name}
                        accountBalance={`${account.currency || 'USD'} ${account.balance.toLocaleString()}`}
                        dailyPL={account.dailyPL}
                        icon={FundedAccountIcon}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default FundedAccounts;