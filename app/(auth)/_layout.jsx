import React from 'react'
import { Slot } from "expo-router";
import '../../global.css';

export default function AuthLayout() {
  return <Slot screenOptions={{ headerShown: false }}/>;
}
