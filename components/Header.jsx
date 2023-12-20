import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function Header() {
  return (
    <View>
      <Text style={ styles.title }>Mobile To Do List</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 35,
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
})