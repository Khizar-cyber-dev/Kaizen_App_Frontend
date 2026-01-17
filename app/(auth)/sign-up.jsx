import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const SignUp = () => {
  const { register } = useUserStore();
  const { signInWithGoogle } = useGoogleAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSignUp = () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    register(formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="flex-row items-center mb-3">
                <Ionicons name="walk" size={36} color="#10B981" />
                <Text className="text-4xl font-bold text-white ml-3">Kizen</Text>
              </View>

              <Text className="text-emerald-400 text-xl font-semibold mb-2">
                Welcome to Kizen 👋
              </Text>

              <Text className="text-gray-400 text-base text-center leading-6 px-2">
                Build discipline, stay consistent, and walk daily toward the strongest version of yourself.
                No motivation — just action.
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-5">
              {/* Name Input */}
              <View>
                <Text className="text-emerald-400 mb-2 font-medium">Name</Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                  <Ionicons name="person-outline" size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 text-white ml-3 text-base"
                    placeholder="Enter your name"
                    placeholderTextColor="#6B7280"
                    value={formData.name}
                    onChangeText={(value) => handleChange('name', value)}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View>
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
                    autoComplete="email"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
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
                    autoCapitalize="none"
                    autoComplete="password"
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={togglePasswordVisibility}>
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

              {/* Sign Up Button */}
              <TouchableOpacity
                className="bg-emerald-600 rounded-xl py-4 items-center mt-6 active:bg-emerald-700"
                onPress={handleSignUp}
                activeOpacity={0.9}
              >
                <Text className="text-white font-bold text-lg">Create Account</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-700" />
                <Text className="text-gray-500 mx-4">Or continue with</Text>
                <View className="flex-1 h-px bg-gray-700" />
              </View>

              {/* Social Login */}
              <TouchableOpacity
                className="bg-gray-800 rounded-xl py-4 items-center active:bg-gray-700"
                onPress={() => signInWithGoogle()}
              >
                <View className="flex-row items-center">
                  <Ionicons name="logo-google" size={24} color="#10B981" />
                  <Text className="text-white font-bold text-lg ml-3">Sign Up with Google</Text>
                </View>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center mt-8 pb-8">
                <Text className="text-gray-400">Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity>
                    <Text className="text-emerald-400 font-semibold">Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SignUp;