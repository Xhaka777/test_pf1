import { useAuth } from '@clerk/clerk-expo';

export async function getWebSocketToken(): Promise<string> {
  const { getToken } = useAuth();
  const clerkToken = await getToken();
  
  if (!clerkToken) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/generate_ws_token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get WebSocket token: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status !== 'success' || !data.token) {
    throw new Error('Invalid WebSocket token response');
  }

  return data.token;
}

function getWebSocketOrigin(): string {
  // Based on the documentation
  const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL;
  if (baseUrl?.includes('staging')) {
    return 'https://staging.propfirmone.com';
  }
  return 'https://app.propfirmone.com';
}