import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  CheckBox,
  TextInput,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { BarCodeScanner } from "expo-barcode-scanner";
import { GlobalStyles } from "../constants/GlobalStyles";
import { ScrollView } from "react-native-gesture-handler";
import Draggable from "react-native-draggable";

import Colors from "../constants/Colors";
import Icon from "../components/Icon";
import EventSummaryCard from "../components/EventSummaryCard";
import UserCard from "../components/UserCard";

export default function HomeScreen() {
  const [openCamera, setCamera] = useState(false);
  const [openModal, setModal] = useState(false);

  const [name, setName] = useState("");
  const [zID, setzID] = useState("");
  const [isArcMem, setIsArmMem] = useState(false);

  const [internalError, setError] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);

  const [isDragging, setDrag] = useState(false);

  useEffect(() => {
    async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
    };
    refreshData();
  }, []);

  const modalSubmitForm = () => {
    fetch("https://nemesis2.dev.unswengsoc.com/checkin", {
      zid: zID,
    })
      .then((res) => res.json())
      .then((data) => {
        if (internalError) {
          setError(false);
        }
        alert("Sent!");
      })
      .catch((error) => setError(true));

    setModal(false);
    setzID("");
    setName("");
    setIsArmMem(false);
  };

  const wait = (timeout) => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  };

  const [recentSignIns, setSignIns] = useState([]);
  const [statPercentage, setStatPercentage] = useState(75);

  const refreshData = React.useCallback(() => {
    console.log("Refreshing for home screen");
    setRefreshing(true);
    fetch("https://nemesis2.dev.unswengsoc.com/recentattendees")
      .then((res) => res.json())
      .then((data) => {
        if (internalError) {
          setError(false);
        }
        setSignIns(data);
      })
      .catch((error) => console.log(error));

    fetch("https://nemesis2.dev.unswengsoc.com/signedinpercentage")
      .then((res) => res.json())
      .then((data) => {
        setStatPercentage(data.signedinpercentage);
      })
      .catch((error) => setError(true));

    wait(1500).then(() => setRefreshing(false));
  }, []);

  return (
    <>
      {/* View when camera is open */}
      {openCamera && (
        <>
          <BarCodeScanner
            onBarCodeScanned={({ type, data }) => {
              setCamera(false);
              setModal(true);
              setzID(data);
            }}
            style={styles.cameraStyle}
          />
          {/* Camera Button (Always in view) */}
          <Draggable x={175} y={600}>
            <TouchableOpacity
              style={styles.cameraButtonClose}
              onPress={() => {
                setCamera(!openCamera);
              }}
            >
              <Icon size={40} focused={Colors.navyBlue} name="md-close" />
            </TouchableOpacity>
          </Draggable>
        </>
      )}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
        }
        style={GlobalStyles.contentContainer}
      >
        {/* View when camera is NOT open*/}
        {!openCamera && (
          <View>
            {/* Cards showing recent sign-ins */}
            <Text style={GlobalStyles.headerText}>Recent Sign ins</Text>
            <EventSummaryCard percentage={statPercentage} />
            {recentSignIns.map((person) => (
              <UserCard
                fname={person.first_name}
                lname={person.last_name}
                zid={person.zid}
                checked_in={person.checked_in}
                paid={person.paid}
                time={person.checked_in_time}
                info={person.information}
              />
            ))}

            {/* Card to add a new sign-in */}
            <TouchableOpacity
              style={styles.addSignInContainer}
              onPress={() => {
                setModal(true);
              }}
            >
              <Icon size={35} focused={Colors.darkGrey} name="md-add" />
              <Text style={styles.addInputText}>Add Manually</Text>
            </TouchableOpacity>

            {/* Camera Button */}
            <Draggable x={300} y={500}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => {
                  setCamera(!openCamera);
                }}
              >
                <Icon size={27} focused={Colors.white} name="md-camera" />
              </TouchableOpacity>
            </Draggable>
          </View>
        )}

        {/* Open Modal when button has been pressed */}
        {openModal && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={openModal}
            onRequestClose={() => {
              setModal(false);
              setzID("");
              setName("");
              setIsArmMem(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalButton}>
                {zID == "" ? (
                  <TouchableOpacity
                    onPress={() => {
                      setModal(false);
                      setzID("");
                      setName("");
                      setIsArmMem(false);
                    }}
                  >
                    <Icon size={35} focused={Colors.darkGrey} name="md-trash" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      modalSubmitForm();
                      setModal(false);
                      setzID("");
                      setName("");
                      setIsArmMem(false);
                    }}
                  >
                    <Icon
                      size={35}
                      focused={Colors.darkGrey}
                      name="md-paper-plane"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputContainer}>
                <View style={styles.inputContent}>
                  <TextInput
                    placeholder="Full Name"
                    value={name}
                    onChangeText={(n) => {
                      setName(n);
                    }}
                  />
                </View>
                <View style={styles.inputContent}>
                  <TextInput
                    placeholder="zID"
                    value={zID}
                    onChangeText={(id) => {
                      setzID(id);
                    }}
                  />
                </View>

                <View style={styles.inputLabel}>
                  <Text>Are you an arc-member?</Text>
                  <CheckBox
                    value={isArcMem}
                    onValueChange={(isChecked) => {
                      setIsArmMem(isChecked);
                    }}
                  ></CheckBox>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  cameraStyle: {
    ...StyleSheet.absoluteFillObject,
  },

  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 100 / 2,
    backgroundColor: Colors.oceanBlue,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOpacity: 1.0,
    elevation: 10,
    zIndex: 1,
  },
  cameraButtonClose: {
    width: 70,
    height: 70,
    borderRadius: 100 / 2,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOpacity: 1.0,
    elevation: 5,
    zIndex: 1,
  },

  addSignInContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginVertical: 5,
    marginHorizontal: 15,
    height: 80,
    display: "flex",
    alignItems: "center",
    padding: 5,
    elevation: 1,
    flexDirection: "row",
    justifyContent: "center",
  },

  addInputText: {
    fontWeight: "bold",
    color: Colors.darkGrey,
    fontSize: 20,
    margin: 7,
  },

  modalContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    margin: 20,
    top: 220,
    backgroundColor: Colors.white,
    borderRadius: 20,
    shadowColor: "black",
    elevation: 200,
    height: 300,
    paddingBottom: 35,
    paddingTop: 25,
    borderWidth: 1,
    borderColor: Colors.veryLightGrey,
    backfaceVisibility: "hidden",
  },

  modalButton: {
    borderWidth: 1,
    borderColor: Colors.darkGrey,
    borderRadius: 15,
    height: 60,
    width: 60,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  inputLabel: {
    padding: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 14,
    color: Colors.grey,
  },

  inputContainer: {
    width: 270,
  },

  inputContent: {
    marginBottom: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 5,
  },
});
