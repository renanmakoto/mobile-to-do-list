import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function Empty() {
  return (
    <View>
      <Text style={ styles.title }>Your task list is empty</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        textAlign: "center",
        color: "white",
        marginTop: 25,
    }
})