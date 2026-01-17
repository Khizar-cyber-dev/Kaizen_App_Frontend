import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const SignIn = () => {
  const { login } = useUserStore();
  const { signInWithGoogle } = useGoogleAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSignIn = () => {
    // Validation
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    const data = {
      email: formData.email,
      password: formData.password
    }
    console.log(data);
    login(data);

  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Header */}
          <View className="items-center mb-12">
            <View className="flex-row items-center mb-2">
              <Ionicons name="walk" size={36} color="#10B981" />
              <Text className="text-4xl font-bold text-white ml-3">Kizen</Text>
            </View>
            <Text className="text-gray-400 text-lg">Welcome Back towards a better Life.</Text>
          </View>

          {/* Form */}
          <View className="space-y-6">
            {/* Email Input */}
            <View className='mb-4'>
              <Text className="text-emerald-400 mb-2 font-medium">Email</Text>
              <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 text-white ml-3 text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className='mb-4'>
              <Text className="text-emerald-400 mb-2 font-medium">Password</Text>
              <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 text-white ml-3 text-base"
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={togglePasswordVisibility}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forget Password Link */}
            <Link href="/(auth)/reset-password">
              <Text className="text-emerald-400 mt-2">Forgot Password?</Text>
            </Link>

            {/* Sign In Button */}
            <TouchableOpacity
              className="bg-emerald-600 rounded-xl py-4 items-center mt-6 active:bg-emerald-700"
              onPress={handleSignIn}
              activeOpacity={0.9}
            >
              <Text className="text-white font-bold text-lg">Log In</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-700" />
              <Text className="text-gray-500 mx-4">Or continue with</Text>
              <View className="flex-1 h-px bg-gray-700" />
            </View>

            {/* Social Login */}
            <TouchableOpacity
              className="bg-gray-800 rounded-xl py-4 items-center mt-6 active:bg-gray-700"
              activeOpacity={0.9}
              onPress={() => signInWithGoogle()}
            >
              <View className="flex-row items-center">
                <Ionicons name="logo-google" size={24} color="#10B981" />
                <Text className="text-white font-bold text-lg ml-3">Sign in with Google</Text>
              </View>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-400">Dont have account? </Text>
              <TouchableOpacity>
                <Text className="text-emerald-400 font-semibold">
                  <Link href="/(auth)/sign-up">SignUp</Link>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SignIn