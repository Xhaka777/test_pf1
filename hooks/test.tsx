import { useAuth } from '@clerk/clerk-expo';

export function testNewWebSocketAuth() {
  const { getToken } = useAuth();

  const testWebSocketTokenFlow = async () => {
    console.log('🧪 Testing new WebSocket authentication flow...');

    try {
      // Step 1: Get WebSocket token
      console.log('Step 1: Getting WebSocket token...');
      const clerkToken = await getToken();
      
      const tokenResponse = await fetch('https://staging-server.propfirmone.com/generate_ws_token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('✅ WebSocket token received:', tokenData.status);
      
      if (tokenData.status !== 'success' || !tokenData.token) {
        throw new Error('Invalid token response');
      }

      // Step 2: Test WebSocket connection with token
      console.log('Step 2: Testing WebSocket connection...');
      const wsUrl = `wss://staging-server.propfirmone.com/all_prices?auth_key=${tokenData.token}`;
      
      const ws = new WebSocket(wsUrl, undefined, {
        headers: {
          'Origin': 'https://staging.propfirmone.com' // Note: staging, not staging-server
        }
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 10000); // 10 second timeout

        ws.onopen = () => {
          console.log('🎉 SUCCESS! WebSocket connected with new auth system!');
          clearTimeout(timeout);
          
          // Test subscription
          ws.send('SubAdd:0~CTrader~AlphaCapitalGroup');
          
          setTimeout(() => {
            ws.close();
            resolve('success');
          }, 3000);
        };

        ws.onmessage = (event) => {
          console.log('📨 Received WebSocket data:', event.data.substring(0, 100) + '...');
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket connection failed:', error);
          clearTimeout(timeout);
          reject(error);
        };

        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          clearTimeout(timeout);
          if (event.code !== 1000) {
            reject(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
          }
        };
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  };

  return { testWebSocketTokenFlow };
}