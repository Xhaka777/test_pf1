import { useCallback } from 'react';
import { usePostHog } from '@/providers/posthog';
import { useAccounts } from '@/providers/accounts';

export function usePostHogTracking() {
  const { track, isInitialized } = usePostHog();
  const { selectedAccountId } = useAccounts();

  const trackEvent = useCallback((
    event: string, 
    properties?: Record<string, any>
  ) => {
    if (!isInitialized) {
      // console.log('[PostHog] Not initialized, skipping event:', event);
      return;
    }

    const enhancedProperties = {
      ...properties,
      selectedAccountId,
      timestamp: new Date().toISOString(),
      platform: 'mobile',
    };

    // console.log('[PostHog] Tracking event:', event, enhancedProperties);
    track(event, enhancedProperties);
  }, [track, isInitialized, selectedAccountId]);

  // Trading-specific tracking functions
  const trackTradeAction = useCallback((action: string, tradeData?: any) => {
    trackEvent(`trade_${action}`, {
      action,
      symbol: tradeData?.symbol,
      position_type: tradeData?.position_type,
      quantity: tradeData?.quantity,
      account_id: tradeData?.account || selectedAccountId,
      order_type: tradeData?.order_type,
      exchange: tradeData?.exchange,
    });
  }, [trackEvent, selectedAccountId]);

  const trackScreenView = useCallback((screenName: string, params?: any) => {
    trackEvent('screen_view', {
      screen_name: screenName,
      ...params,
    });
  }, [trackEvent]);

  const trackAccountAction = useCallback((action: string, accountData?: any) => {
    trackEvent(`account_${action}`, {
      action,
      account_id: accountData?.id || selectedAccountId,
      account_type: accountData?.account_type,
      exchange: accountData?.exchange,
      firm: accountData?.firm,
      balance: accountData?.balance,
    });
  }, [trackEvent, selectedAccountId]);

  const trackAuthAction = useCallback((action: string, authData?: any) => {
    trackEvent(`auth_${action}`, {
      action,
      method: authData?.method,
      success: authData?.success,
      error: authData?.error,
    });
  }, [trackEvent]);

  const trackError = useCallback((error: string, context?: any) => {
    trackEvent('error_occurred', {
      error_message: error,
      error_context: context,
      screen: context?.screen,
      function: context?.function,
    });
  }, [trackEvent]);

  const trackNavigation = useCallback((action: string, navigationData?: any) => {
    trackEvent(`navigation_${action}`, {
      action,
      from_screen: navigationData?.from,
      to_screen: navigationData?.to,
      tab: navigationData?.tab,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackTradeAction,
    trackScreenView,
    trackAccountAction,
    trackAuthAction,
    trackError,
    trackNavigation,
    isInitialized,
  };
}