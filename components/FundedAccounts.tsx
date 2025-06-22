import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BrokerPLCard from './BokerPLCard';
import icons from '@/constants/icons';
import { useNavigation } from '@react-navigation/native';
import images from '@/constants/images';

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
                    <BrokerPLCard
                        key={account.id}
                        account={account}
                        activeTab='Funded'
                        tabImage={images.funding_pips}
                        accountName={account.name}
                        accountBalance={account.balance}
                        dailyPL={account.dailyPL}
                    />
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default FundedAccounts;