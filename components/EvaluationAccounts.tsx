import { TouchableOpacity, View } from "react-native";
import BrokerPLCard from "./BokerPLCard";
import images from "@/constants/images";


interface EvaluationAccountsProps {
    accounts: Array<{
        id: number;
        name: string;
        balance: string;
        dailyPL: string;
        changePercentage: string;
    }>,
    onAccountPress: (account: any) => void;
}

const EvaluationAccounts = ({
    accounts,
    onAccountPress
}: EvaluationAccountsProps) => {

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
                        activeTab='Evaluation'
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

export default EvaluationAccounts;