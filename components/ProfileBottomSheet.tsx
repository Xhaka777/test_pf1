import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useUser } from '@clerk/clerk-expo';
import { LogOut, X } from 'lucide-react-native';
import images from '@/constants/images';

interface ProfileBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  onSignOutPress: () => void;
}

const ProfileBottomSheet = ({ bottomSheetRef, onSignOutPress }: ProfileBottomSheetProps) => {
  const { user } = useUser();
  const snapPoints = useMemo(() => ['10%'], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: '#1e1e1e' }}
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
            source={images.avatar80}
            className='w-20 h-20 rounded-full mb-3'
          />
          <Text className='text-white text-base font-InterSemiBold'>
            Altin Xhaka
          </Text>
          <Text className='text-white text-base font-InterSemiBold'>
            {user?.emailAddresses[0]?.emailAddress || ''}
          </Text>
          <View className='bg-pink-800 px-3 py-1 rounded mt-2'>
            <Text className='text-pink-200 text-base font-InterSemiBold'>Free Plan</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onSignOutPress}
          className='border border-danger-800 px-4 py-3 rounded-lg flex-row items-center justify-center space-x-2'
        >
          <LogOut size={16} color='#C53030' />
          <Text className='text-danger-700 font-InterSemiBold text-lg ml-2'>Sign out</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default ProfileBottomSheet;