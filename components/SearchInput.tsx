import React, { useState } from "react";
import { TextInput, View } from "react-native";
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
        <View className="">
            <View className="mb-4 border border-gray-800 bg-propfirmone-200 flex-row items-center rounded-lg px-3 py-0.3 mt-2">
                <Search
                    size={20}
                    color='#898587'
                />
                <TextInput
                    className="bg-propfirmone-200 text-white rounded-md text-base ml-1 font-Inter"
                    placeholder="Search"
                    placeholderTextColor="#9ca3af"
                    value={searchText}
                    onChangeText={handleTextChange}
                />
            </View>
        </View>
    );
}

export default SearchInput;