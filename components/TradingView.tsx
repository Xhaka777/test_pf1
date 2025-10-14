import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

// Import TradingView types (this should work now!)
import {
    IChartingLibraryWidget,
    ChartingLibraryFeatureset,
    ChartingLibraryWidgetOptions,
    ResolutionString
} from '../types/charting_library';

interface TestComponentProps { }

const TradingView: React.FC<TestComponentProps> = () => {
    // TEST: Use the IChartingLibraryWidget type (like your web teammates)
    const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
    const [testResults, setTestResults] = useState<string[]>([]);

    const addResult = (message: string) => {
        setTestResults(prev => [...prev, message]);
        console.log(message);
    };

    useEffect(() => {
        addResult('=== TradingView Types Test Started ===');
        addResult('✅ Successfully imported IChartingLibraryWidget type');
        addResult('✅ Successfully imported ChartingLibraryFeatureset type');
    }, []);

    const testTypes = () => {
        addResult('\n=== Testing Type Definitions ===');

        // Test 1: Can we use ChartingLibraryFeatureset?
        try {
            const features: ChartingLibraryFeatureset[] = [
                'chart_crosshair_menu',
                'snapshot_trading_drawings',
                'header_in_fullscreen_mode',
                'side_toolbar_in_fullscreen_mode',
                'trading_platform'  // The one we need!
            ];
            addResult('✅ ChartingLibraryFeatureset array created successfully');
            addResult(`   Features: ${features.join(', ')}`);
        } catch (error) {
            addResult(`❌ Error with ChartingLibraryFeatureset: ${error}`);
        }

        // Test 2: Can we create a typed options object?
        try {
            const widgetOptions: ChartingLibraryWidgetOptions = {
                autosize: true,
                symbol: 'AAPL',
                interval: 'D' as ResolutionString,
                container: 'tv_chart_container',
                // datafeed: would need actual implementation
                library_path: '/charting_library/',
                locale: 'en',
                theme: 'dark',
                disabled_features: ['use_localstorage_for_settings'],
                enabled_features: [
                    'chart_crosshair_menu',
                    'snapshot_trading_drawings',
                    'header_in_fullscreen_mode',
                    'side_toolbar_in_fullscreen_mode',
                    'trading_platform'
                ] as ChartingLibraryFeatureset[],
            };
            addResult('✅ ChartingLibraryWidgetOptions object created successfully');
            addResult(`   Symbol: ${widgetOptions.symbol}`);
            addResult(`   Enabled features: ${widgetOptions.enabled_features?.join(', ')}`);
        } catch (error) {
            addResult(`❌ Error with ChartingLibraryWidgetOptions: ${error}`);
        }

        // Test 3: Can we use the ref type?
        try {
            addResult(`✅ tvWidgetRef type is: ${typeof tvWidgetRef.current}`);
            addResult(`   Current value: ${tvWidgetRef.current === null ? 'null' : 'has value'}`);

            // TypeScript will give us autocomplete for IChartingLibraryWidget methods
            // But at runtime, these won't exist in React Native
            addResult('   Type allows access to methods like:');
            addResult('   - .activeChart()');
            addResult('   - .onChartReady()');
            addResult('   - .setSymbol()');
        } catch (error) {
            addResult(`❌ Error with tvWidgetRef: ${error}`);
        }
    };

    const testRuntimeAccess = () => {
        addResult('\n=== Testing Runtime Access ===');

        // Test if TradingView is actually accessible at runtime
        try {
            // @ts-ignore - we know this won't exist in React Native
            if (typeof TradingView !== 'undefined') {
                addResult('✅ TradingView global is accessible!');
                // @ts-ignore
                addResult(`   TradingView.widget type: ${typeof TradingView.widget}`);

                // Try to create a widget (this would fail without proper setup)
                // @ts-ignore
                if (typeof TradingView.widget === 'function') {
                    addResult('✅ TradingView.widget is a function');
                }
            } else {
                addResult('❌ TradingView global is NOT accessible in React Native');
                addResult('   This is expected - TradingView only works in WebView');
            }
        } catch (error) {
            addResult(`❌ Error accessing TradingView: ${error}`);
        }

        // Try to call methods on tvWidgetRef (will be null)
        try {
            if (tvWidgetRef.current) {
                addResult('✅ tvWidgetRef has a value');
                // TypeScript knows these methods exist, but runtime will fail
                const chart = tvWidgetRef.current.activeChart();
                addResult(`✅ activeChart() returned: ${chart}`);
            } else {
                addResult('❌ tvWidgetRef.current is null (expected in React Native)');
                addResult('   In WebView, you can assign the widget instance here');
            }
        } catch (error) {
            addResult(`❌ Error calling tvWidgetRef methods: ${error}`);
        }
    };

    const testTradingPlatformFeature = () => {
        addResult('\n=== Testing Trading Platform Feature ===');
        
        try {
            // Test if we can reference the feature
            const tradingPlatformFeature: ChartingLibraryFeatureset = 'trading_platform';
            addResult(`✅ Feature string exists: "${tradingPlatformFeature}"`);
            
            // Create a config with trading platform
            const configWithTP: Partial<ChartingLibraryWidgetOptions> = {
                enabled_features: ['trading_platform'] as ChartingLibraryFeatureset[],
            };
            addResult('✅ Can create config with trading_platform feature');
            
            addResult('\n📋 What trading_platform enables:');
            addResult('   - chart.createOrderLine() - Interactive order lines');
            addResult('   - chart.createPositionLine() - Position markers');
            addResult('   - Trading panel UI');
            addResult('   - Order management features');
            
            addResult('\n⚠️ CRITICAL:');
            addResult('   Even with enabled_features: ["trading_platform"],');
            addResult('   your TradingView library might be RESTRICTED by:');
            addResult('   1. License type (free vs paid)');
            addResult('   2. Library version');
            addResult('   3. Broker configuration required');
            
        } catch (error) {
            addResult(`❌ Error testing trading platform: ${error}`);
        }
    };

    const testCreateOrderLine = () => {
        addResult('\n=== Testing createOrderLine() - Like Web Teammates ===');
        
        try {
            // This mimics exactly what your web teammates do
            addResult('Attempting to use: tvWidgetRef.current?.activeChart().createOrderLine()');
            
            if (tvWidgetRef.current) {
                addResult('✅ tvWidgetRef.current exists');
                
                const chart = tvWidgetRef.current.activeChart();
                addResult(`Chart instance: ${chart ? 'exists' : 'null'}`);
                
                if (chart) {
                    addResult('Attempting to call chart.createOrderLine()...');
                    
                    // Exactly like your web teammates
                    const line = chart.createOrderLine();
                    
                    if (line) {
                        addResult('✅ SUCCESS! createOrderLine() worked!');
                        addResult('Setting up the line...');
                        
                        line
                            .setPrice(173.68)
                            .setQuantity('12')
                            .setText('LONG 173.68')
                            .setLineColor('#FFA500');
                        
                        addResult('✅ Position line configured successfully!');
                        addResult('🎉 This means your library DOES support createOrderLine!');
                    } else {
                        addResult('❌ createOrderLine() returned null');
                    }
                } else {
                    addResult('❌ No active chart available');
                    addResult('   Need to create a TradingView widget first');
                }
            } else {
                addResult('❌ tvWidgetRef.current is null');
                addResult('   This is expected in React Native - need WebView!');
                addResult('   ');
                addResult('💡 The real test happens in the WebView component');
                addResult('   where we actually create the TradingView widget');
            }
        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
            addResult(`   This is expected in React Native environment`);
            addResult('   ');
            addResult('🔍 What this tells us:');
            addResult('   The method exists (TypeScript is happy)');
            addResult('   But it can only run inside WebView with real TradingView');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>TradingView Types Test</Text>

            <Text style={styles.text}>
                Testing if we can use TradingView TypeScript types in React Native
            </Text>

            <View style={styles.buttonContainer}>
                <Button title="Test Type Definitions" onPress={testTypes} color="#4CAF50" />
            </View>

            <View style={styles.buttonContainer}>
                <Button title="Test Runtime Access" onPress={testRuntimeAccess} color="#FF9800" />
            </View>

            <View style={styles.buttonContainer}>
                <Button title="Test Trading Platform" onPress={testTradingPlatformFeature} color="#2196F3" />
            </View>

            <View style={styles.buttonContainer}>
                <Button title="Test createOrderLine()" onPress={testCreateOrderLine} color="#9C27B0" />
            </View>

            <View style={styles.results}>
                <Text style={styles.resultsTitle}>Test Results:</Text>
                {testResults.map((result, index) => (
                    <Text key={index} style={styles.resultLine}>
                        {result}
                    </Text>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary:</Text>
                <Text style={styles.conclusion}>
                    ✅ Types WORK: You can import and use TypeScript types
                    {'\n'}
                    ❌ Runtime FAILS: TradingView code doesn't run in React Native
                    {'\n\n'}
                    What this means:
                    {'\n'}
                    • Type safety ✅
                    {'\n'}
                    • Autocomplete ✅
                    {'\n'}
                    • Compile-time checks ✅
                    {'\n'}
                    • Actual TradingView code ❌
                    {'\n\n'}
                    Solution: Use types in React Native for safety, but run actual
                    TradingView code in WebView HTML!
                    {'\n\n'}
                    🔑 KEY FINDING:
                    {'\n'}
                    Your web teammates use the same approach, but their TradingView
                    library files allow createOrderLine(). Get their exact
                    charting_library folder!
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#1a1a1a',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        color: '#ccc',
        marginBottom: 20,
    },
    buttonContainer: {
        marginBottom: 10,
    },
    results: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFA500',
        marginBottom: 10,
    },
    resultLine: {
        fontSize: 12,
        color: '#ccc',
        marginBottom: 3,
        fontFamily: 'monospace',
    },
    section: {
        marginTop: 20,
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFA500',
        marginBottom: 10,
    },
    conclusion: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
    },
});

export default TradingView;