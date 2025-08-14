import { PropsWithChildren, useMemo } from "react";
import { Text, View } from "react-native";
import { PlatformAvatar } from "./PlatformAvatar";
import { PropfirmAvatar } from "./PropfirmAvatar";
import { useAccounts } from "@/providers/accounts";
import { PlatformImage } from "./PlatformImage";


export function AccountCard({
    exchange,
    firm,
    name,
    id,
    children,
}: {
    exchange: string;
    firm: string;
    name: string;
    id: number | string;
} & PropsWithChildren) {

    const { selectedAccountId, allAccounts } = useAccounts();

    const selectedAccount = useMemo(() => {
        return [
            ...(allAccounts?.broker_accounts ?? []),
            ...(allAccounts?.prop_firm_accounts ?? []),
            ...(allAccounts?.bt_accounts ?? []),
            ...(allAccounts?.copier_accounts ?? []),
            ...(allAccounts?.competition_accounts ?? []),
        ]?.find((account) => account.id === selectedAccountId);
    }, [
        allAccounts?.broker_accounts,
        allAccounts?.bt_accounts,
        allAccounts?.competition_accounts,
        allAccounts?.copier_accounts,
        allAccounts?.prop_firm_accounts,
        selectedAccountId
    ]);

    return (
        <View className="flex-row items-start gap-2 text-sm">
            {/* <PropfirmAvatar name={firm ?? name} logo={firmLogo} /> */}
            <View className="flex-col items-start">
                <Text className="text-xs font-semibold">{name}</Text>
                <View className="flex-row gap-2 items-center">
                    <PlatformImage 
                        exchange={selectedAccount?.exchange}
                        size={16}
                    />
                    <Text className="text-xs font-normal text-foreground-tertiary">
                        ID: {id}
                    </Text>
                </View>
                {children}
            </View>
        </View>
    );

}