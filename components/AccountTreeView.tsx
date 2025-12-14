import React from 'react';
import { View, Text } from 'react-native';
import MenuAccounts from './MenuAccounts';

interface AccountTreeViewProps {
  treeData: Array<{ master: any; slaves: any[] }>;
  onAccountPress: (account: any) => void;
  currentAccountId?: number;
  onArchivePress?: (account: any) => void;
  context: 'menu' | 'overview';
}

const AccountTreeView: React.FC<AccountTreeViewProps> = ({
  treeData,
  onAccountPress,
  currentAccountId,
  onArchivePress,
  context
}) => {
  return (
    <View>
      {treeData.map((treeNode, index) => (
        <View key={`${treeNode.master.id}-${index}`}>
          {/* Master Account */}
          <MenuAccounts
            accounts={[treeNode.master]}
            onAccountPress={onAccountPress}
            accountType="propFirm"
            activeTab="All"
            currentAccountId={currentAccountId}
            onArchivePress={onArchivePress}
            context={context}
            showMasterIcon={true} // Add this prop to show crown icon
          />
          
          {/* Slave Accounts - Indented */}
          {treeNode.slaves.length > 0 && (
            <View className="ml-6 border-l-2 border-gray-600 pl-4">
              <MenuAccounts
                accounts={treeNode.slaves}
                onAccountPress={onAccountPress}
                accountType="propFirm"
                activeTab="All"
                currentAccountId={currentAccountId}
                onArchivePress={onArchivePress}
                context={context}
                showSlaveIcon={true} // Add this prop to show different styling
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

export default AccountTreeView;