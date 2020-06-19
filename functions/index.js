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
        title: 'Confirmação do serviço',
        body: 'Seu horário está ok. Agora é só esperar que enviaremos um barbeiro até você.',
      },
      canceled: {
        title: 'Remarcação',
        body: 'Neste horário não podemos atende-lo. Entraremos em contato para remarca-lo. Aguarde!',
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
