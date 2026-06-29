import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  children: ReactNode;
  tone?: "blue" | "green" | "gray";
  size?: number;
};

export function IconBubble({ children, tone = "blue", size = 50 }: Props) {
  return (
    <View style={[styles.bubble, styles[tone], { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.content}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: "center",
    justifyContent: "center"
  },
  blue: {
    backgroundColor: "#e7f5ff"
  },
  green: {
    backgroundColor: "#e8f8ef"
  },
  gray: {
    backgroundColor: "#f1f3f5"
  },
  content: {
    color: "#2296df",
    fontSize: 24,
    fontWeight: "800"
  }
});

