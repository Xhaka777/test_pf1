import { X } from "lucide-react-native";
import { Platform, TouchableOpacity } from "react-native";


interface SignOutButtonProps {
    onPress: () => void;
}

function SignOutButton({ onPress }: SignOutButtonProps) {
    return (
        <TouchableOpacity
            className="p-2 rounded-lg justify-center items-center min-h-11 min-w-11 active:bg-gray-100"
            style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
        >
            <X size={20} color='#fff' />
        </TouchableOpacity>
    )
}

export default SignOutButton;