import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BrokerPLCard from './BokerPLCard';
import icons from '@/constants/icons';
import { useNavigation } from '@react-navigation/native';
import images from '@/constants/images';
import PropFirmPLCard from './PropFirmPLCard';
import { FundedAccountIcon } from './icons/FundedAccountIcon';

interface FundedAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: string;
        dailyPL: string;
        changePercentage: string;
    }>,
    onAccountPress: (account: any) => void;
}

const FundedAccounts = ({
    accounts,
    onAccountPress
}: FundedAccountsProps) => {

    return (
        <View className="mt-2">
            {accounts.map((account: any) => (
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