import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useUser } from '@clerk/clerk-expo';
import { LogOut, X } from 'lucide-react-native';
import images from '@/constants/images';
import { useGetCurrentUser } from '@/api/hooks/auth';

interface ProfileBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  onSignOutPress: () => void;
}

const ProfileBottomSheet = ({ bottomSheetRef, onSignOutPress }: ProfileBottomSheetProps) => {
  const { user } = useUser();
  const snapPoints = useMemo(() => ['10%'], []);
  const { data: currentUser, isLoading } = useGetCurrentUser();

  const planInfo = useMemo(() => {
    if (isLoading || !currentUser) {
      return { text: 'Loading...', bgColor: 'bg-gray-800', textColor: 'text-gray-200' };
    }

    const plan = currentUser.sub_plan;

    return { text: plan, bgColor: '#45152C', textColor: '#F190BF' };
  }, [currentUser, isLoading]);

  console.log('planInfo', planInfo)

  console.log('user?.imageUrl', user?.imageUrl)

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: '#100E0F', borderColor: '#1E1E2D', borderWidth: 1 }}
      handleIndicatorStyle={{ backgroundColor: '#666' }}
    >
      <BottomSheetView style={{ flex: 1, height: '5%', padding: 24 }}>
        <View className='flex-row justify-between items-center'>
          <Text className='text-white text-lg font-InterSemiBold'>Profile</Text>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
            <X size={24} color='#898587' />
          </TouchableOpacity>
        </View>
        <View className='items-center mb-6'>
          <Image
            source={{ uri: user?.imageUrl || images.profile_clerk }}
            className='w-20 h-20 rounded-full mb-3'
          />
          <Text className='text-white text-base font-InterSemiBold'>
            {user?.firstName} {user?.lastName || ''}
          </Text>
          <Text className='text-white text-base font-InterSemiBold'>
            {user?.emailAddresses[0]?.emailAddress || ''}
          </Text>
          <View
            className="px-3 py-1 rounded mt-2"
            style={{ backgroundColor: planInfo.bgColor }}
          >
            <Text
              className="text-base font-InterSemiBold"
              style={{ color: planInfo.textColor }}
            >
              {planInfo.text}
            </Text>
          </View>

        </View>
        <TouchableOpacity
          onPress={onSignOutPress}
          className='border border-[#F05252] px-4 py-3 rounded-lg flex-row items-center justify-center space-x-2'
        >
          <LogOut size={16} color='#F05252' />
          <Text className='text-[#F05252] font-InterSemiBold text-lg ml-2'>Sign out</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default ProfileBottomSheet;