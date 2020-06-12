const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const firestore = admin.firestore();

const messaging = admin.messaging();

exports.sendNotificationOnUpdateAppointment = functions.firestore
  .document('/appointments/{id}')
  .onUpdate(async (snapshot) => {
    const newStatus = snapshot.after.get('status');
    const changedStatus = snapshot.before.get('status') !== newStatus;

    const notificationMappedByStatus = {
      booked: {
        title: 'Sua solicitação foi aprovada!',
        body: 'Acesse o aplicativo para visualizar mais detalhes',
      },
      done: {
        title: 'Sua solicitação foi concluída!',
        body: 'Acesse o aplicativo para visualizar mais detalhes',
      },
      canceled: {
        title: 'Sua solicitação foi cancelada!',
        body: 'Acesse o aplicativo para visualizar mais detalhes',
      },
    }

    const notification = notificationMappedByStatus[newStatus];

    if (changedStatus && notification) {
      const user = await firestore
        .collection('users')
        .doc(snapshot.after.get('userId'))
        .get();

      const deviceToken = user.get('deviceToken');
      if (deviceToken) {
        await messaging.sendToDevice(deviceToken, {
          notification,
        });
      }
    }
  });
