# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Project Structure

```
├── app/
│   ├── _layout.tsx                 # Root layout configuration
│   ├── +not-found.tsx             # 404 error page
│   ├── (auth)/                    # Authentication routes
│   │   ├── _layout.tsx            # Auth layout configuration
│   │   ├── login.tsx              # Login screen
│   │   ├── signup.tsx             # Sign up screen
│   │   └── reset-password.tsx     # Password reset screen
│   ├── (tabs)/                    # Main app tabs
│   │   ├── _layout.tsx            # Tab navigation configuration
│   │   ├── overview.tsx           # Dashboard/Overview screen
│   │   ├── trade.tsx              # Trading interface
│   │   ├── positions.tsx          # Position management
│   │   └── account.tsx            # Account settings
│   └── menu.tsx                   # Account switching menu
├── components/                     # Reusable components
├── hooks/                         # Custom React hooks
│   └── useFrameworkReady.ts       # Framework initialization hook
├── assets/                        # Static assets
│   └── images/                    # Image assets
├── types/                         # TypeScript type definitions
├── app.json                       # Expo configuration
├── package.json                   # Project dependencies
└── tsconfig.json                  # TypeScript configuration
```

## Features

### Authentication
- Secure login/signup system
- Password reset functionality
- Session management

### Overview Screen
- Account type switching (Prop Firm/Own Broker)
- Performance statistics
- Account balance tracking
- Portfolio overview

### Trade Screen
- Asset listing
- Market order execution
- Limit order placement
- Stop order configuration
- Take Profit/Stop Loss management

### Positions Screen
- Open positions monitoring
- Order management
- Trading history
- Position modification
- Share trading results

### Account Screen
- Performance analytics
- Account statistics
- Personal details
- Settings management

### Menu
- Account switching
- Product selection
- Profile management
- Security settings

## Technology Stack

- React Native
- Expo SDK 52.0.30
- Expo Router 4.0.17
- TypeScript
- React Navigation

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open the app:
- Web: Open the provided local URL in your browser
- iOS/Android: Scan the QR code with Expo Go app

## Project Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_API_KEY=your_api_key
```

### Expo Configuration

The app.json file contains all Expo-specific configurations:

- App name and version
- Splash screen and icon
- Platform-specific settings
- Navigation configuration

## Best Practices

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Implement proper error handling
- Use React hooks for state management

### Navigation
- Implement deep linking
- Handle navigation state persistence
- Manage authentication flow
- Support gesture navigation

### Performance
- Optimize render cycles
- Implement proper list virtualization
- Handle memory management
- Cache network requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request




## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
