import * as SecureStore from 'expo-secure-store'
import { useAuth } from '@clerk/clerk-expo';


const { getToken } = useAuth();

// const fetchWithAuth = async () => {
//     try {
//         const token = await getToken();

//         const response = await fet
//     } catch (error) {
        
//     }
// }











// export interface TokenCache {
//     getToken: (key: string) => Promise<string | undefined | null>;
//     saveToken: (key: string, token: string) => Promise<void>;
//     clearToken?: (key: string) => void;
// }

//Cache the Clerk JWT
// export const tokenCache = {
//     async getToken(key: string) {
//         try {
//             const item = await SecureStore.getItemAsync(key)
//             if (item) {
//                 console.log(`${key} was used  🔐 \n`)
//             } else {
//                 console.log("No values stored under key: " + key);
//             }
//             return item;
//         } catch (error) {
//             console.error("SecureStore get item error: ", error)
//             await SecureStore.deleteItemAsync(key);
//             return null;
//         }
//     },
//     async saveToken(key: string, value: string) {
//         try {
//             return SecureStore.setItemAsync(key, value);
//         } catch (error) {
//             return;
//         }
//     }
// }

//googleOAuth...