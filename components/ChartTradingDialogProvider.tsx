import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { OrderTypeEnum, PositionTypeEnum } from "@/shared/enums";
import { StatusEnum } from '@/api/services/api';
import { useCreateTradeMutation } from '@/api/hooks/trade-service';

export type ChartTradingDialogRequestOptions = {
  orderPrice: number;
  marketPrice: number;
  symbol: string;
};

export type ChartTradingDialogResponse = {
  submitted: boolean;
  type?: OrderTypeEnum;
  status?: StatusEnum;
};

export type ChartTradingDialogContextType = {
  requestPosition: (
    options: ChartTradingDialogRequestOptions,
  ) => Promise<ChartTradingDialogResponse>;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  isLoading?: boolean;
  setIsLoading?: (open: boolean) => void;
};

const ChartTradingDialogContext = createContext<ChartTradingDialogContextType>({
  requestPosition: () => Promise.resolve({ submitted: false }),
});

interface ChartTradingDialogProviderProps {
  children: React.ReactNode;
  onCreateTrade?: (tradeData: any) => Promise<{ status: string; message: string }>;
  defaultLots?: number;
  selectedAccountId?: number;
}

export function ChartTradingDialogProvider({
  children,
  onCreateTrade,
  defaultLots = 0.01,
  selectedAccountId,
}: ChartTradingDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderMode, setOrderMode] = useState<boolean>(false);
  const [orderType, setOrderType] = useState<OrderTypeEnum | null>(null);
  const [position, setPosition] = useState<PositionTypeEnum | null>(null);
  const [quantity, setQuantity] = useState<string>(defaultLots.toString());
  const [options, setOptions] = useState<ChartTradingDialogRequestOptions>({
    orderPrice: 0,
    marketPrice: 0,
    symbol: '',
  });
  const [isCreationPending, setIsCreationPending] = useState(false);
  const resolveRef = useRef<(value: ChartTradingDialogResponse) => void>();

  // Use the mutation from your existing hook
  const { mutateAsync: createTradeMutation } = useCreateTradeMutation();

  const clearDialogState = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setOrderMode(false);
    setOrderType(null);
    setPosition(null);
    setQuantity(defaultLots.toString());
    setOptions({
      orderPrice: 0,
      marketPrice: 0,
      symbol: '',
    });
  }, [defaultLots]);

  const requestPosition = useCallback(
    (config: ChartTradingDialogRequestOptions) => {
      console.log('requestPosition called with:', config);
      setOptions(config);
      setIsOpen(true); // Make sure to open the dialog
      return new Promise<ChartTradingDialogResponse>((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [],
  );

  const onFormSubmit = useCallback(async () => {
    if (!orderType) {
      Alert.alert('Error', 'An error occurred while opening the order.');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity.');
      return;
    }

    const tradeData = {
      account: selectedAccountId,
      symbol: options.symbol,
      order_type: orderType,
      position: position,
      risk_multiplier: null,
      quantity: quantity,
      price: options.orderPrice.toString(),
      limit_price: options.orderPrice.toString(),
    };

    try {
      setIsCreationPending(true);
      
      // Use either the passed onCreateTrade or the mutation
      let response;
      if (onCreateTrade) {
        response = await onCreateTrade(tradeData);
      } else {
        response = await createTradeMutation(tradeData as any);
      }
      
      if (response.status === 'SUCCESS' || response.status === StatusEnum.SUCCESS) {
        Alert.alert('Success', 'Position has been successfully opened');
        clearDialogState();
        resolveRef.current?.({
          submitted: true,
          type: orderType,
          status: StatusEnum.SUCCESS,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to open a position');
        resolveRef.current?.({
          submitted: false,
          status: StatusEnum.ERROR,
        });
      }
    } catch (error) {
      console.error('Error opening order:', error);
      Alert.alert('Error', 'An error occurred while opening the order.');
      resolveRef.current?.({
        submitted: false,
        status: StatusEnum.ERROR,
      });
    } finally {
      setIsCreationPending(false);
    }
  }, [
    clearDialogState,
    onCreateTrade,
    createTradeMutation,
    options.orderPrice,
    options.symbol,
    orderType,
    position,
    quantity,
    selectedAccountId,
  ]);

  const handleCancel = useCallback(() => {
    clearDialogState();
    resolveRef.current?.({ submitted: false });
  }, [clearDialogState]);

  const handleLimitOrder = useCallback(() => {
    setOrderType(OrderTypeEnum.LIMIT);
    setOrderMode(true);
    setPosition(
      options.orderPrice > options.marketPrice
        ? PositionTypeEnum.SHORT
        : PositionTypeEnum.LONG,
    );
  }, [options.orderPrice, options.marketPrice]);

  const handleStopOrder = useCallback(() => {
    setOrderType(OrderTypeEnum.STOP);
    setOrderMode(true);
    setPosition(
      options.orderPrice > options.marketPrice
        ? PositionTypeEnum.LONG
        : PositionTypeEnum.SHORT,
    );
  }, [options.orderPrice, options.marketPrice]);

  const getPositionColor = () => {
    return position === PositionTypeEnum.SHORT ? '#FF0000' : '#12de1f';
  };

  return (
    <ChartTradingDialogContext.Provider
      value={{ requestPosition, isOpen, setIsOpen, isLoading, setIsLoading }}
    >
      {children}
      
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: '#333333'
          }}>
            {/* Header */}
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Chart Trading
            </Text>

            {/* Content */}
            <View style={{ marginBottom: 20 }}>
              {isLoading ? (
                <View style={{ 
                  height: 100, 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <ActivityIndicator size="large" color="#00d4aa" />
                </View>
              ) : (
                <View>
                  {orderType ? (
                    <View>
                      <Text style={{ color: '#cccccc', fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
                        Do you want to open a{' '}
                        <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
                          {orderType}
                        </Text>{' '}
                        <Text style={{ 
                          color: getPositionColor(), 
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {position}
                        </Text>{' '}
                        order at{' '}
                        <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
                          {options.orderPrice.toLocaleString('en-US', {
                            maximumFractionDigits: 5,
                          })}
                        </Text>{' '}
                        on{' '}
                        <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
                          {options.symbol}
                        </Text>
                        ?
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#cccccc', fontSize: 14, textAlign: 'center' }}>
                      Please select an Order type to open: Limit or Stop
                    </Text>
                  )}

                  {orderMode && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={{ 
                        color: '#ffffff', 
                        fontSize: 14, 
                        marginBottom: 8,
                        fontWeight: '500'
                      }}>
                        Position Size
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#2a2a2a',
                          borderRadius: 6,
                          padding: 12,
                          color: '#ffffff',
                          fontSize: 16,
                          borderWidth: 1,
                          borderColor: '#333333'
                        }}
                        value={quantity}
                        onChangeText={setQuantity}
                        placeholder="Enter position size"
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                      />
                      <Text style={{ 
                        color: '#888888', 
                        fontSize: 12, 
                        marginTop: 4 
                      }}>
                        Enter custom position size
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Footer Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              justifyContent: 'space-between'
            }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: '#333333',
                  borderRadius: 6,
                  padding: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              {orderMode ? (
                <TouchableOpacity
                  onPress={onFormSubmit}
                  disabled={isCreationPending}
                  style={{
                    flex: 1,
                    backgroundColor: isCreationPending ? '#333333' : '#00d4aa',
                    borderRadius: 6,
                    padding: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ 
                    color: '#000000', 
                    fontSize: 14, 
                    fontWeight: '500',
                    marginRight: isCreationPending ? 8 : 0
                  }}>
                    Open Order
                  </Text>
                  {isCreationPending && (
                    <ActivityIndicator size="small" color="#000000" />
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleLimitOrder}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: '#00d4aa',
                      borderRadius: 6,
                      padding: 12,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: '#00d4aa', fontSize: 14, fontWeight: '500' }}>
                      Limit Order
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleStopOrder}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: '#00d4aa',
                      borderRadius: 6,
                      padding: 12,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: '#00d4aa', fontSize: 14, fontWeight: '500' }}>
                      Stop Order
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ChartTradingDialogContext.Provider>
  );
}

export function useChartTradingDialog() {
  return useContext(ChartTradingDialogContext);
}