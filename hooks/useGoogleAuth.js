import React from "react";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const signInWithGoogle = React.useCallback(async () => {
        try {
            const { createdSessionId, setActive } = await startOAuthFlow({
                redirectUrl: Linking.createURL("/(auth)/sign-in", { scheme: "mobile" }),
            });

            if (createdSessionId) {
                if (setActive) {
                    await setActive({ session: createdSessionId });
                }
            }
        } catch (err) {
            console.error("OAuth error", err);
        }
    }, []);

    return { signInWithGoogle };
};
