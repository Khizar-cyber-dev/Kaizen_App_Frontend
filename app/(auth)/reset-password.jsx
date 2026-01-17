import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUserStore } from '@/store/useUserStore'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const ResetPassword = () => {
    const router = useRouter()
    const { resetOtp, resetPassword } = useUserStore();
    const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [otpSent, setOtpSent] = useState(false)

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleSendOtp = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address')
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            const success = await resetOtp(email)
            if (success) {
                setOtpSent(true)
                setStep(2)
                setCountdown(60) // 60 seconds countdown
                Alert.alert('Success', 'OTP sent to your email')
            } else {
                Alert.alert('Error', 'Failed to send OTP. Please try again.')
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP')
            return
        }

        setLoading(true)
        try {
            // Here you would typically verify OTP first
            // For now, let's assume OTP verification is done in resetPassword
            setStep(3)
        } catch (error) {
            Alert.alert('Error', 'Failed to verify OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please enter both password fields')
            return
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long')
            return
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const success = await resetPassword({ email, otp, newPassword })
            if (success) {
                Alert.alert(
                    'Success',
                    'Password reset successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.push('/(auth)/sign-in')
                        }
                    ]
                )
            } else {
                Alert.alert('Error', 'Failed to reset password. Please try again.')
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (countdown > 0) return

        setLoading(true)
        try {
            const success = await resetOtp(email)
            if (success) {
                setCountdown(60)
                Alert.alert('Success', 'New OTP sent to your email')
            } else {
                Alert.alert('Error', 'Failed to resend OTP')
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to resend OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <View className="flex-1 px-6 py-8">
                {/* Header */}
                <View className="mb-10">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="lock-closed" size={32} color="#10B981" />
                        <Text className="text-3xl font-bold text-white ml-3">Reset Password</Text>
                    </View>
                    <Text className="text-gray-400 text-base">
                        {step === 1 && 'Enter your email to receive a password reset OTP'}
                        {step === 2 && 'Enter the 6-digit OTP sent to your email'}
                        {step === 3 && 'Create your new password'}
                    </Text>
                </View>

                {/* Progress Indicator */}
                <View className="flex-row items-center justify-between mb-10">
                    {[1, 2, 3].map((num) => (
                        <View key={num} className="items-center flex-1">
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${step >= num ? 'bg-emerald-600' : 'bg-gray-800'}`}>
                                <Text className={`font-bold ${step >= num ? 'text-white' : 'text-gray-400'}`}>{num}</Text>
                            </View>
                            <Text className={`text-xs mt-2 ${step >= num ? 'text-emerald-400' : 'text-gray-500'}`}>
                                {num === 1 ? 'Email' : num === 2 ? 'OTP' : 'New Password'}
                            </Text>
                        </View>
                    ))}
                    <View className="absolute top-5 left-0 right-0 h-0.5 bg-gray-800 -z-10" />
                </View>

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <View className="space-y-6">
                        <View>
                            <Text className="text-emerald-400 mb-2 font-medium">Email Address</Text>
                            <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 text-white ml-3 text-base"
                                    placeholder="Enter your registered email"
                                    placeholderTextColor="#6B7280"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            className="bg-emerald-600 rounded-xl py-4 items-center mt-4"
                            onPress={handleSendOtp}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            <Text className="text-white font-bold text-lg">
                                {loading ? 'Sending...' : 'Send OTP'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 2: OTP Input */}
                {step === 2 && (
                    <View className="space-y-6">
                        <View>
                            <Text className="text-emerald-400 mb-2 font-medium">6-digit OTP</Text>
                            <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                                <Ionicons name="key-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 text-white ml-3 text-base"
                                    placeholder="Enter 6-digit OTP"
                                    placeholderTextColor="#6B7280"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>
                            {otpSent && (
                                <Text className="text-gray-500 text-sm mt-2">
                                    OTP sent to: <Text className="text-emerald-400">{email}</Text>
                                </Text>
                            )}
                        </View>

                        <View className="flex-row space-x-4 mt-4">
                            <TouchableOpacity
                                className="flex-1 bg-gray-800 rounded-xl py-4 items-center mr-2"
                                onPress={() => setStep(1)}
                                activeOpacity={0.9}
                            >
                                <Text className="text-gray-300 font-medium">Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 bg-emerald-600 rounded-xl py-4 items-center ml-2"
                                onPress={handleVerifyOtp}
                                disabled={loading || otp.length !== 6}
                                activeOpacity={0.9}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="items-center mt-6">
                            <Text className="text-gray-400 mb-2">
                                Didn't receive OTP?
                            </Text>
                            <TouchableOpacity
                                onPress={handleResendOtp}
                                disabled={countdown > 0 || loading}
                            >
                                <Text className={`font-semibold ${countdown > 0 ? 'text-gray-500' : 'text-emerald-400'}`}>
                                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <View className="space-y-6">
                        <View>
                            <Text className="text-emerald-400 mb-2 font-medium">New Password</Text>
                            <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 text-white ml-3 text-base"
                                    placeholder="Enter new password"
                                    placeholderTextColor="#6B7280"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-gray-500 text-xs mt-2 ml-1">
                                Must be at least 6 characters long
                            </Text>
                        </View>

                        <View>
                            <Text className="text-emerald-400 mb-2 font-medium">Confirm Password</Text>
                            <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 text-white ml-3 text-base"
                                    placeholder="Confirm new password"
                                    placeholderTextColor="#6B7280"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row space-x-4 mt-6">
                            <TouchableOpacity
                                className="flex-1 bg-gray-800 rounded-xl py-4 items-center mr-2"
                                onPress={() => setStep(2)}
                                activeOpacity={0.9}
                            >
                                <Text className="text-gray-300 font-medium">Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 bg-emerald-600 rounded-xl py-4 items-center ml-2"
                                onPress={handleResetPassword}
                                disabled={loading}
                                activeOpacity={0.9}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Back to Login */}
                <TouchableOpacity
                    className="items-center mt-10"
                    onPress={() => router.push('/(auth)/sign-in')}
                >
                    <Text className="text-emerald-400 font-medium">
                        Back to Sign In
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default ResetPassword