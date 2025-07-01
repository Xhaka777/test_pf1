import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Button } from 'react-native';
import { WebView } from 'react-native-webview';

const BundleFileLoader = () => {
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentApproach, setCurrentApproach] = useState(0);

  // Different approaches to load from iOS bundle
  const getApproaches = () => [
    {
      name: "Bundle Resource Direct",
      source: { uri: '../ios/index.html' }
    },
    {
      name: "Bundle with File Protocol", 
      source: { uri: 'file:///index.html' }
    },
    {
      name: "Main Bundle Path",
      source: { uri: 'file://' + 'index.html' }
    },
    {
      name: "Asset Bundle Resource",
      source: { uri: Platform.select({
        ios: 'index.html',
        android: 'file:///android_asset/index.html'
      }) }
    },
    {
      name: "Require Static Asset",
      source: Platform.OS === 'ios' ? 
        require('../ios/index.html') : 
        { uri: 'file:///android_asset/index.html' }
    }
  ];

  const approaches = getApproaches();
  const currentSource = approaches[currentApproach];

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(`📱 [${currentSource.name}] Message:`, data);
      
      if (data.type === 'chartReady') {
        setLoading(false);
        setError(null);
        console.log(`✅ SUCCESS with approach: ${currentSource.name}`);
      } else if (data.type === 'error') {
        console.log(`❌ ERROR with approach ${currentSource.name}:`, data.message);
        setError(`[${currentSource.name}] ${data.message}`);
        setLoading(false);
      } else if (data.type === 'debug') {
        console.log(`🔍 [${currentSource.name}] Debug:`, data.message);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  const tryNextApproach = () => {
    const nextIndex = (currentApproach + 1) % approaches.length;
    setCurrentApproach(nextIndex);
    setLoading(true);
    setError(null);
    console.log(`🔄 Trying approach ${nextIndex + 1}: ${approaches[nextIndex].name}`);
  };

  const renderCurrentInfo = () => (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>Testing Approach {currentApproach + 1}/{approaches.length}</Text>
      <Text style={styles.infoText}>{currentSource.name}</Text>
      <Text style={styles.sourceText}>
        Source: {JSON.stringify(currentSource.source, null, 2)}
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1976d2" />
      <Text style={styles.loadingText}>Testing Bundle File Access...</Text>
      <Text style={styles.loadingSubText}>{currentSource.name}</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>❌ Approach Failed</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Button 
        title={`Try Next Approach (${((currentApproach + 1) % approaches.length) + 1}/${approaches.length})`}
        onPress={tryNextApproach}
      />
      <Text style={styles.helpText}>
        If all approaches fail, the issue is likely:{'\n'}
        • Files not properly added to Xcode bundle{'\n'}
        • Missing "Create folder references" setting{'\n'}
        • index.html not in correct location
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderCurrentInfo()}
      
      {loading && renderLoading()}
      
      {error && renderError()}
      
      <WebView
        ref={webviewRef}
        source={currentSource.source}
        style={[styles.webview, (loading || error) ? styles.hidden : styles.visible]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        originWhitelist={['*']}
        onMessage={handleWebViewMessage}
        onLoadStart={(syntheticEvent) => {
          const { url } = syntheticEvent.nativeEvent;
          console.log(`📝 [${currentSource.name}] Loading started:`, url);
        }}
        onLoadEnd={(syntheticEvent) => {
          const { url } = syntheticEvent.nativeEvent;
          console.log(`📝 [${currentSource.name}] Loading finished:`, url);
          
          // Check if URL is still about:blank (indicates bundle loading failed)
          if (url === 'about:blank') {
            setError(`Bundle file not accessible - URL remained 'about:blank'`);
            setLoading(false);
            return;
          }
          
          // Wait for JavaScript response
          setTimeout(() => {
            if (loading) {
              setError(`No response from HTML file - check TradingView library paths`);
              setLoading(false);
            }
          }, 3000);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn(`❌ [${currentSource.name}] WebView error:`, nativeEvent);
          setError(`WebView Error: ${nativeEvent.description || 'Unknown error'}`);
          setLoading(false);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn(`❌ [${currentSource.name}] HTTP error:`, nativeEvent);
          setError(`HTTP Error: ${nativeEvent.statusCode} - ${nativeEvent.description || 'Unknown'}`);
          setLoading(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#444',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  helpText: {
    color: '#666',
    textAlign: 'left',
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    marginTop: 15,
  },
});

export default BundleFileLoader;