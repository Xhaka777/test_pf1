import { PropsWithChildren, useMemo } from "react";
import { Text, View } from "react-native";
import { PlatformAvatar } from "./PlatformAvatar";
import { PropfirmAvatar } from "./PropfirmAvatar";


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
    // const { list: allFirmList } = usePropFirm();

    // const firmLogo = useMemo(() => {
    //     return allFirmList?.data.find((f) => f.name === firm)?.logo;
    // }, [firm, allFirmList]);

    return (
        <View className="flex-row items-start gap-2 text-sm">
            {/* <PropfirmAvatar name={firm ?? name} logo={firmLogo} /> */}
            <View className="flex-col items-start">
                <Text className="text-xs font-semibold">{name}</Text>
                <View className="flex-row gap-2 items-center">
                    <PlatformAvatar exchange={exchange} />
                    <Text className="text-xs font-normal text-foreground-tertiary">
                        ID: {id}
                    </Text>
                </View>
                {children}
            </View>
        </View>
    );

}