import { View, Text, TextInput, StyleSheet, TouchableOpacity, Keyboard } from 'react-native'
import React, { useState } from 'react'

export default function Input({ submitHandler }) {
    const [value, setValue] = useState("")

    const onChangeText = (text) => {
        setValue(text)
    }

    const handleAddHabit = () => {
        setValue(submitHandler(value))
        setValue("")
        Keyboard.dismiss()
    }

  return (
    <View>
      <View>
        <TextInput 
            style={styles.input}
            placeholder="Add your task!"
            placeholderTextColor="#BBBB"
            value={value}
            onChangeText={onChangeText}
        />
          
        <TouchableOpacity onPress={handleAddHabit} style={styles.button}>
            <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    input: {
        width: 200,
        color: "white",
        borderWidth: 1,
        borderColor: "#FFFFFF",
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    button: {
        borderWidth: 1,
        borderColor: "#BBB",
        borderRadius: 5,
        paddingVertical: 15,
        marginTop: 25,
    },
    buttonText: {
        color: "white",
        textAlign: "center",
    }
})
