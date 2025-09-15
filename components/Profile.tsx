import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { ChevronRight } from 'lucide-react-native';
import images from '@/constants/images';
import { useGetCurrentUser } from '@/api/hooks/auth';

interface ProfileProps {
  className?: string;
  onProfilePress: () => void;
}

const Profile = ({ className, onProfilePress }: ProfileProps) => {
  const { user } = useUser();
  const { data: currentUser, isLoading } = useGetCurrentUser();

  const planInfo = useMemo(() => {
    if (isLoading || !currentUser) {
      return { text: 'Loading...', bgColor: 'bg-gray-800', textColor: 'text-gray-200' };
    }

    const plan = currentUser.sub_plan;

    return { text: plan, bgColor: '#45152C', textColor: '#F190BF' };
  }, [currentUser, isLoading]);


  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-6 py-3 w-full ${className || ''}`}
      onPress={onProfilePress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <Image
          source={{ uri: user?.imageUrl || images.profile_clerk }}
          // source={images.profile_clerk}
          className="w-12 h-12 rounded-full mr-3"
        />

        <View>
          <Text className="text-white text-base font-Inter">
            {user?.firstName} {user?.lastName || ''}
          </Text>
          <Text className="text-white text-sm font-Inter">
            {user?.emailAddresses[0]?.emailAddress || ''}
          </Text>

          <View
            className="px-2 py-1 rounded mt-1 self-start"
            style={{ backgroundColor: planInfo.bgColor }}
          >
            <Text
              className="text-sm font-InterSemiBold"
              style={{ color: planInfo.textColor }}
            >
              {planInfo.text}
            </Text>
          </View>
        </View>
      </View>

      <ChevronRight color="#888" size={20} />
    </TouchableOpacity>
  );
};

export default Profile;