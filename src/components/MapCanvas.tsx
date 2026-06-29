import { StyleSheet, Text, View } from "react-native";
import { ConnectionState, NodeItem, Region } from "../types";

type Props = {
  state: ConnectionState;
  selectedNode: NodeItem;
  regions: Region[];
};

export function MapCanvas({ state, selectedNode, regions }: Props) {
  return (
    <View style={styles.map}>
      <View style={[styles.landMass, styles.landNorthAmerica]} />
      <View style={[styles.landMass, styles.landEurope]} />
      <View style={[styles.landMass, styles.landAsia]} />
      <View style={[styles.landMass, styles.landAfrica]} />
      <View style={styles.gridLineOne} />
      <View style={styles.gridLineTwo} />

      <View style={styles.statusPill}>
        <View style={[styles.statusDot, state === "connected" ? styles.dotConnected : styles.dotIdle]} />
        <Text style={styles.statusText}>{state === "connected" ? "已连接" : state === "connecting" ? "连接中" : "未连接"}</Text>
      </View>

      <View style={styles.toolStack}>
        <Text style={styles.toolButton}>↻</Text>
        <Text style={styles.toolButton}>🔔</Text>
        <Text style={styles.toolButton}>↗</Text>
      </View>

      {regions.map((region) => {
        const isActive = region.id === selectedNode.regionId;
        return (
          <View
            key={region.id}
            style={[
              styles.nodeMarker,
              {
                left: `${region.coordinate.left}%`,
                top: `${region.coordinate.top}%`
              },
              isActive && (state === "connected" ? styles.markerConnected : styles.markerActive)
            ]}
          >
            <View style={[styles.markerCore, isActive && state === "connected" ? styles.coreConnected : styles.coreIdle]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    minHeight: 410,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#dfe5f1"
  },
  landMass: {
    position: "absolute",
    backgroundColor: "rgba(248, 250, 255, 0.72)"
  },
  landNorthAmerica: {
    width: 210,
    height: 250,
    left: -54,
    top: 38,
    borderTopRightRadius: 110,
    borderBottomRightRadius: 90,
    transform: [{ rotate: "14deg" }]
  },
  landEurope: {
    width: 170,
    height: 130,
    left: 150,
    top: 180,
    borderRadius: 80,
    transform: [{ rotate: "-8deg" }]
  },
  landAsia: {
    width: 260,
    height: 210,
    right: -38,
    top: 130,
    borderRadius: 110,
    transform: [{ rotate: "-13deg" }]
  },
  landAfrica: {
    width: 120,
    height: 170,
    left: 210,
    top: 275,
    borderRadius: 70,
    transform: [{ rotate: "8deg" }]
  },
  gridLineOne: {
    position: "absolute",
    top: 155,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.36)"
  },
  gridLineTwo: {
    position: "absolute",
    top: 280,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.28)"
  },
  statusPill: {
    position: "absolute",
    left: 24,
    top: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: "#98a4b8",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 5
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5
  },
  dotConnected: {
    backgroundColor: "#20e85f"
  },
  dotIdle: {
    backgroundColor: "#9aa0a6"
  },
  statusText: {
    color: "#202329",
    fontSize: 18,
    fontWeight: "800"
  },
  toolStack: {
    position: "absolute",
    right: 24,
    top: 55,
    gap: 16
  },
  toolButton: {
    width: 56,
    height: 56,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#ffffff",
    color: "#4c5563",
    fontSize: 24,
    lineHeight: 56,
    textAlign: "center",
    shadowColor: "#8d98ad",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5
  },
  nodeMarker: {
    position: "absolute",
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(68, 100, 230, 0.2)"
  },
  markerActive: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginLeft: -11,
    marginTop: -11,
    backgroundColor: "rgba(68, 100, 230, 0.24)"
  },
  markerConnected: {
    width: 74,
    height: 74,
    borderRadius: 37,
    marginLeft: -20,
    marginTop: -20,
    backgroundColor: "rgba(34, 218, 109, 0.25)"
  },
  markerCore: {
    width: 24,
    height: 24,
    borderWidth: 4,
    borderColor: "#ffffff",
    borderRadius: 14,
    backgroundColor: "#335bea"
  },
  coreConnected: {
    backgroundColor: "#22dd68"
  },
  coreIdle: {
    backgroundColor: "#335bea"
  }
});

