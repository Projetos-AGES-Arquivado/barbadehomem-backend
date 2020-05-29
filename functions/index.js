const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const firestore = admin.firestore();

const messaging = admin.messaging();

exports.sendNotificationOnUpdateAppointment = functions.firestore
  .document('/appointments/{id}')
  .onUpdate(async (snapshot) => {
    const changedStatus = snapshot.before.get('status') !== snapshot.after.get('status');
    const newStatusIsBooked = snapshot.after.get('status') === 'booked';

    if (changedStatus && newStatusIsBooked) {
      const user = await firestore
        .collection('users')
        .doc(snapshot.after.get('userId'))
        .get();

      const deviceToken = user.get('deviceToken');
      if (deviceToken) {
        await messaging.sendToDevice(deviceToken, {
          notification: {
            title: 'Sua solicitação foi aprovada!',
            body: 'Acesse o aplicativo para visualizar os detalhes',
          },
        });
      }
    }
  });
