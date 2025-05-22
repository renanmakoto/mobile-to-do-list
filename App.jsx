import { StatusBar } from "expo-status-bar"
import React, { useState } from "react"
import { StyleSheet, FlatList, View, Text } from "react-native"
import Empty from "./components/Empty"
import Header from "./components/Header"
import Input from "./components/Input"
import Task from "./components/Task"

export default function App() {
  const [data, setData] = useState([])

  const submitHandler = (value) => {
    setData((prevTask) => {
      return [
        {
          value: value,
          key: Math.random().toString(),
        },
        ...prevTask,
      ]
    })
  }

  const deleteItem = (key) => {
    setData(prevTask => {
      return prevTask.filter((task) => {task.key != key})
    })
  }

  return (
    <View style={styles.container}>
      
      <FlatList
        data={data}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={() => <Header />}
        ListEmptyComponent={() => <Empty />}
        renderItem={({item}) => <Task item={item} deleteItem={deleteItem} />}
      />
      
      <View>
        <Input submitHandler={submitHandler}/>
      </View>
      
      <StatusBar style="light" />

      <Text style={styles.footer}>2023 - by dotExtension | Renan Makoto</Text>
      
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    paddingVertical: 60,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  footer: {
    color: "white",
    fontWeight: "bold",
    marginTop: 30
  }
})
