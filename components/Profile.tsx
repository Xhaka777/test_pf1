import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { ChevronRight } from 'lucide-react-native';
import images from '@/constants/images';

interface ProfileProps {
  className?: string;
  planName?: string;
  onProfilePress: () => void;
}

const Profile = ({ className, planName = 'Free Plan', onProfilePress }: ProfileProps) => {
  const { user } = useUser();
  
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-6 py-3 w-full ${className || ''}`}
      onPress={onProfilePress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <Image
          // source={{ uri: user?.imageUrl || 'https://via.placeholder.com/40' }}
          source={images.avatar32}
          className="w-12 h-12 rounded-full mr-3"
        />
        
        <View>
          <Text className="text-white text-base font-Inter">
            {user?.firstName} {user?.lastName || ''}
          </Text>
          <Text className="text-white text-sm font-Inter">
            {user?.emailAddresses[0]?.emailAddress || ''}
          </Text>
          
          <View className="bg-primary-900 px-2 py-1 rounded mt-1 self-start">
            <Text className="text-primary-200 text-sm font-InterSemiBold">{planName}</Text>
          </View>
        </View>
      </View>
      
      <ChevronRight color="#888" size={20} />
    </TouchableOpacity>
  );
};

export default Profile;