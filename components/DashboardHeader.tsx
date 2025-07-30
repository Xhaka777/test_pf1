import { AccountDetails } from "@/api/schema";
import { View } from "react-native";
import { AccountTypeEnum } from "@/shared/enums";
import { AccountCard } from "./AccountCard";

interface DashboardHeaderMobileProps {
    accountDetails: AccountDetails | undefined;
}

export function DashboardHeaderMobile({
    accountDetails,
}: DashboardHeaderMobileProps) {

    const typeLabelMap: Record<AccountTypeEnum, string> = {
        [AccountTypeEnum.DEMO]: 'Demo',
        [AccountTypeEnum.FUNDED]: 'Funded',
        [AccountTypeEnum.LIVE]: 'Live',
        [AccountTypeEnum.EVALUATION]: 'Evaluation',
        [AccountTypeEnum.COMPETITION]: 'Competition',
    };

    const typeColorMap: Record<AccountTypeEnum, BadgeVariant> = {
        [AccountTypeEnum.DEMO]: 'green',
        [AccountTypeEnum.LIVE]: 'destructiveDark',
        [AccountTypeEnum.FUNDED]: 'green',
        [AccountTypeEnum.EVALUATION]: 'blue',
        [AccountTypeEnum.COMPETITION]: 'indigo',
    };


    <View className="flex items-center justify-between p-2">
        {accountDetails ? (
            <AccountCard
                exchange={accountDetails.exchange}
                firm={accountDetails.firm}
                name={accountDetails.name}
                id={accountDetails.id}
            />
        ) : null}
        {/* We need to display the badge of the account here based on the type of it... */}
        <View className="ml-8">
            {accountDetails ? (
                type = { accountDetails.account_type }
            )}
        </View>
    </View>
}