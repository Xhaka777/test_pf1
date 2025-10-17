// Create a new component: components/AssetDebugger.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';

export const AssetDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const checkAssets = async () => {
      const logs: string[] = [];
      
      try {
        logs.push(`🔍 Bundle Directory: ${FileSystem.bundleDirectory}`);
        
        // Check what's in the bundle directory
        const bundleContents = await FileSystem.readDirectoryAsync(FileSystem.bundleDirectory);
        logs.push(`📁 Bundle contents: ${bundleContents.join(', ')}`);
        
        // Check if charting_assets exists
        const hasChartingAssets = bundleContents.includes('charting_assets');
        logs.push(`📊 Has charting_assets: ${hasChartingAssets}`);
        
        if (hasChartingAssets) {
          const chartingPath = `${FileSystem.bundleDirectory}charting_assets/`;
          const chartingContents = await FileSystem.readDirectoryAsync(chartingPath);
          logs.push(`📊 charting_assets contents: ${chartingContents.join(', ')}`);
          
          // Check charting_library
          if (chartingContents.includes('charting_library')) {
            const libPath = `${chartingPath}charting_library/`;
            const libContents = await FileSystem.readDirectoryAsync(libPath);
            logs.push(`📚 charting_library contents: ${libContents.join(', ')}`);
            
            // Check if the main file exists
            const hasMainFile = libContents.includes('charting_library.standalone.js');
            logs.push(`📄 Has main JS file: ${hasMainFile}`);
          }
          
          // Check datafeeds
          if (chartingContents.includes('datafeeds')) {
            const datafeedsPath = `${chartingPath}datafeeds/`;
            const datafeedsContents = await FileSystem.readDirectoryAsync(datafeedsPath);
            logs.push(`🔌 datafeeds contents: ${datafeedsContents.join(', ')}`);
          }
        }
        
        // Also check if files exist as assets (alternative approach)
        logs.push(`\n🔍 Trying alternative asset loading...`);
        
      } catch (error) {
        logs.push(`❌ Error: ${error.message}`);
      }
      
      setDebugInfo(logs);
    };
    
    checkAssets();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset Debug Info</Text>
      <ScrollView style={styles.scrollView}>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>
            {info}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100E0F',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});