import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useUserStore } from '../../store/useUserStore'

const VerifyAccount = () => {
    const { verifyOtp, sendOtp, isLoading } = useUserStore()
    const router = useRouter()
    const params = useLocalSearchParams()
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [countdown, setCountdown] = useState(60)
    const [verificationStatus, setVerificationStatus] = useState('pending') // pending, success, failed

    const otpInputs = useRef([])

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    // Focus first input on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            otpInputs.current[0]?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, [])

    const handleOtpChange = (value, index) => {
        if (value.length > 1) {
            // Handle paste
            const pastedValues = value.split('').slice(0, 6)
            const newOtp = [...otp]
            pastedValues.forEach((char, i) => {
                if (i < 6) newOtp[i] = char
            })
            setOtp(newOtp)

            // Focus last filled input
            const lastFilledIndex = pastedValues.length - 1
            if (lastFilledIndex < 5) {
                otpInputs.current[lastFilledIndex + 1]?.focus()
            }
            return
        }

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto focus next input
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus()
        }

        // Auto submit when all digits are filled
        if (newOtp.every(digit => digit !== '') && index === 5) {
            handleVerifyOtp(newOtp.join(''))
        }
    }

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus()
        }
    }

    const handleVerifyOtp = async (otpStringParam) => {
        const otpString = otpStringParam || otp.join('')

        if (otpString.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP')
            return
        }

        try {
            await verifyOtp(otpString);
            setVerificationStatus('success');
            Alert.alert(
                'Success!',
                'Your email has been verified successfully.',
                [
                    {
                        text: 'Continue',
                        onPress: () => router.replace('/(tabs)') // Redirect to main app
                    }
                ]
            )
        } catch (error) {
            setVerificationStatus('failed');
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP. Please try again.');
        }
    }

    const handleResendOtp = async () => {
        if (countdown > 0) return

        try {
            await sendOtp();

            // Reset OTP fields
            setOtp(['', '', '', '', '', ''])
            setCountdown(60)
            setVerificationStatus('pending')

            // Focus first input
            setTimeout(() => {
                otpInputs.current[0]?.focus();
            }, 100);

            Alert.alert('Success', 'New OTP sent to your email')
        } catch (error) {
            Alert.alert('Error', 'Failed to resend OTP. Please try again.')
        }
    }

    const handleChangeEmail = () => {
        router.push('/(auth)/sign-up')
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-6 py-8">
                        {/* Header */}
                        <View className="mb-10">
                            <View className="flex-row items-center mb-4">
                                <Ionicons
                                    name={verificationStatus === 'success' ? "checkmark-circle" : "mail"}
                                    size={32}
                                    color={
                                        verificationStatus === 'success' ? '#10B981' :
                                            verificationStatus === 'failed' ? '#EF4444' : '#10B981'
                                    }
                                />
                                <Text className="text-3xl font-bold text-white ml-3">
                                    {verificationStatus === 'success' ? 'Verified!' : 'Verify Email'}
                                </Text>
                            </View>

                            <Text className="text-gray-400 text-base mb-2">
                                {verificationStatus === 'success'
                                    ? 'Your email has been successfully verified. You can now access all features.'
                                    : 'We sent a 6-digit verification code to your email address.'
                                }
                            </Text>
                        </View>

                        {/* Verification Status Icon */}
                        {verificationStatus === 'success' ? (
                            <View className="items-center my-10">
                                <View className="w-40 h-40 rounded-full bg-emerald-900/30 items-center justify-center mb-6">
                                    <Ionicons name="checkmark-circle" size={100} color="#10B981" />
                                </View>
                                <Text className="text-emerald-400 text-2xl font-bold mb-2">
                                    Verification Successful!
                                </Text>
                                <Text className="text-gray-400 text-center">
                                    You can now access all features of the app
                                </Text>
                            </View>
                        ) : verificationStatus === 'failed' ? (
                            <View className="items-center my-10">
                                <View className="w-40 h-40 rounded-full bg-red-900/30 items-center justify-center mb-6">
                                    <Ionicons name="close-circle" size={100} color="#EF4444" />
                                </View>
                                <Text className="text-red-400 text-2xl font-bold mb-2">
                                    Verification Failed
                                </Text>
                                <Text className="text-gray-400 text-center">
                                    The OTP you entered is incorrect. Please try again.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* OTP Input Boxes */}
                                <View className="mb-10">
                                    <Text className="text-emerald-400 mb-6 font-medium text-center">
                                        Enter the 6-digit code
                                    </Text>

                                    <View className="flex-row justify-between mb-8">
                                        {otp.map((digit, index) => (
                                            <View
                                                key={index}
                                                className={`w-14 h-14 rounded-xl items-center justify-center border-2 ${digit ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-gray-800'
                                                    }`}
                                            >
                                                <TextInput
                                                    ref={ref => otpInputs.current[index] = ref}
                                                    className="w-full h-full text-center text-white text-2xl font-bold"
                                                    value={digit}
                                                    onChangeText={(value) => handleOtpChange(value, index)}
                                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                                    keyboardType="number-pad"
                                                    maxLength={1}
                                                    selectTextOnFocus
                                                    editable={!isLoading}
                                                />
                                            </View>
                                        ))}
                                    </View>

                                    {/* Verify Button */}
                                    <TouchableOpacity
                                        className={`rounded-xl py-4 items-center ${otp.every(digit => digit !== '')
                                            ? 'bg-emerald-600'
                                            : 'bg-emerald-900/50'
                                            }`}
                                        onPress={handleVerifyOtp}
                                        disabled={isLoading || !otp.every(digit => digit !== '')}
                                        activeOpacity={0.9}
                                    >
                                        <Text className="text-white font-bold text-lg">
                                            {isLoading ? 'Verifying...' : 'Verify Account'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Resend OTP Section */}
                                <View className="items-center">
                                    <Text className="text-gray-400 mb-2">
                                        Didn't receive the code?
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleResendOtp}
                                        disabled={countdown > 0 || isLoading}
                                    >
                                        <Text className={`font-semibold ${countdown > 0 ? 'text-gray-500' : 'text-emerald-400'}`}>
                                            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* Navigation Buttons */}
                        {verificationStatus !== 'success' && (
                            <View className="mt-10 space-y-4">
                                <TouchableOpacity
                                    className="border border-gray-700 rounded-xl py-4 items-center"
                                    onPress={() => router.push('/(auth)')}
                                    activeOpacity={0.9}
                                >
                                    <Text className="text-gray-300 font-medium">
                                        Back to Home
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {verificationStatus === 'success' && (
                            <View className="mt-10 space-y-4">
                                <TouchableOpacity
                                    className="bg-emerald-600 rounded-xl py-4 items-center"
                                    onPress={() => router.replace('/(tabs)')}
                                    activeOpacity={0.9}
                                >
                                    <Text className="text-white font-bold text-lg">
                                        Continue to App
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Help Text */}
                        <View className="mt-12 p-4 bg-gray-800/50 rounded-xl">
                            <View className="flex-row items-start mb-2">
                                <Ionicons name="information-circle" size={20} color="#6B7280" />
                                <Text className="text-gray-400 text-sm ml-2 flex-1">
                                    • Check your spam folder if you don't see the email{'\n'}
                                    • The OTP expires after 10 minutes{'\n'}
                                    • Contact support if you're having trouble
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default VerifyAccount