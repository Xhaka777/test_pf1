import React, { useState } from "react";
import { TextInput, View, StyleSheet, Platform } from "react-native";
import { Search } from "lucide-react-native";

interface SearchInputProps {
    onSearch: (text: string) => void;
}

const SearchInput = ({ onSearch }: SearchInputProps) => {
    const [searchText, setSearchText] = useState("");

    const handleTextChange = (text: string) => {
        setSearchText(text);
        onSearch(text);
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Search
                    size={20}
                    color='#898587'
                />
                <TextInput
                    style={styles.textInput}
                    placeholder="Search"
                    placeholderTextColor="#9ca3af"
                    value={searchText}
                    onChangeText={handleTextChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2d2d2d', // propfirmone-200 equivalent
        borderWidth: 1,
        borderColor: '#374151', // gray-800 equivalent
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        marginTop: 8,
    },
    textInput: {
        flex: 1,
        backgroundColor: 'transparent',
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 8,
        fontFamily: 'Inter',
        // iOS specific fixes
        ...(Platform.OS === 'ios' && {
            paddingVertical: 0,
            height: 20,
        }),
        // Android specific
        ...(Platform.OS === 'android' && {
            paddingVertical: 4,
        }),
    },
});

export default SearchInput;