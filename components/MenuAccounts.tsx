// Updated MenuAccounts.tsx
import { TouchableOpacity, View } from "react-native";
import React from "react";
import PropFirmPLCard from "./PropFirmPLCard";
import BrokeragePracticePLCard from "./BokerPLCard";
import { EvaluatedAccountIcon } from "./icons/EvaluatedAccountIcon";
import { FundedAccountIcon } from "./icons/FundedAccountIcon";
import AccountIcon from "./icons/AccountIcon";
import { PracticeIcon } from "./icons/PracticeIcon";

interface MenuAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: number;
        dailyPL: number;
        changePercentage: number;
        type?: 'Evaluation' | 'Funded' | 'Live' | 'Demo';
        currency?: string;
        firm?: string;
        phase?: string;
        target?: number;
        daysRemaining?: number;
        broker?: string;
        leverage?: string;
        server?: string;
        totalPL?: number;
        startingBalance?: number;
    }>,
    onAccountPress: (account: any) => void;
    accountType: 'propFirm' | 'brokerage' | 'practice';
    activeTab?: string; // For determining specific account type within category
}

const MenuAccounts = ({
    accounts,
    onAccountPress,
    accountType,
    activeTab
}: MenuAccountsProps) => {

    // Determine the specific account type based on accountType and activeTab
    const getSpecificAccountType = () => {
        if (accountType === 'propFirm') {
            return activeTab === 'Funded' ? 'Funded' : 'Evaluation';
        } else if (accountType === 'brokerage') {
            return 'Live';
        } else if (accountType === 'practice') {
            return 'Demo';
        }
        return 'Evaluation';
    };

    const specificAccountType = getSpecificAccountType();

    // Get the appropriate icon based on account type
    const getIcon = (accountType: string) => {
        switch (accountType) {
            case 'Evaluation':
                return EvaluatedAccountIcon;
            case 'Funded':
                return FundedAccountIcon;
            case 'Live':
                return AccountIcon;
            case 'Demo':
                return PracticeIcon;
            default:
                return EvaluatedAccountIcon;
        }
    };

    const renderAccountCard = (account: any) => {
        // Format balance for display
        const formattedBalance = `${account.currency || 'USD'} ${account.balance.toLocaleString()}`;
        
        // Add type to account if not present
        const accountWithType = {
            ...account,
            type: account.type || specificAccountType
        };

        // Render PropFirmPLCard for Prop Firm accounts
        if (accountType === 'propFirm') {
            return (
                <PropFirmPLCard
                    key={account.id}
                    account={accountWithType}
                    activeTab={specificAccountType}
                    accountName={account.name}
                    accountBalance={formattedBalance}
                    dailyPL={account.dailyPL}
                    icon={getIcon(specificAccountType)}
                />
            );
        } 
        // Render BrokeragePracticePLCard for Brokerage and Practice accounts
        else {
            return (
                <BrokeragePracticePLCard
                    key={account.id}
                    account={accountWithType}
                    activeTab={specificAccountType}
                    accountName={account.name}
                    accountBalance={formattedBalance}
                    dailyPL={account.dailyPL}
                    icon={getIcon(specificAccountType)}
                />
            );
        }
    };

    return (
        <View className="mt-2">
            {accounts.map((account: any) => (
                <TouchableOpacity
                    key={account.id}
                    onPress={() => onAccountPress(account)}
                >
                    {renderAccountCard(account)}
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default MenuAccounts;