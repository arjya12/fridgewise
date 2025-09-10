// This is a simple script to demonstrate local notifications
// You can't run this directly with Node.js because it requires the Expo environment
// Instead, copy this code into a component or screen in your app to test

/*
import * as Notifications from 'expo-notifications';

// Function to test local notifications
export async function testLocalNotification() {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test local notification from FridgeWise",
        data: { testData: 'test' }
      },
      trigger: null, // Show immediately
    });
    
    console.log(`Local notification scheduled with ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}
*/

// HOW TO USE:
// 1. Create a button in any screen of your app
// 2. Import the function above
// 3. Call it when the button is pressed
// 4. Example:
/*
  <Button 
    title="Test Notification" 
    onPress={async () => {
      try {
        const id = await testLocalNotification();
        Alert.alert("Notification scheduled", `ID: ${id}`);
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    }} 
  />
*/
