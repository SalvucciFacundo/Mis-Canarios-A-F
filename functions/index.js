// Cargar variables de entorno en desarrollo
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { createPreference } = require('./mercadoPago');
admin.initializeApp();

exports.createPreference = functions.https.onRequest(createPreference);

// Función para obtener la suscripción del usuario
exports.getUserSubscription = functions.https.onRequest(async (req, res) => {
  console.log('getUserSubscription called with method:', req.method);
  console.log('getUserSubscription URL:', req.url);
  console.log('getUserSubscription headers:', req.headers);

  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS request');
    return res.status(200).send('');
  }

  // Obtener UID de query parameter o de la URL
  let uid = req.query.uid;

  // Si no está en query, intentar extraer de la URL path
  if (!uid) {
    const urlParts = req.url.split('/');
    uid = urlParts[urlParts.length - 1];

    // Si la URL termina con parámetros, extraer del path
    if (uid && uid.includes('?')) {
      uid = uid.split('?')[0];
    }
  }

  console.log('URL parts:', req.url.split('/'));
  console.log('Extracted UID:', uid);

  if (!uid || uid === 'subscription') {
    console.log('Invalid UID, returning 400');
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    console.log('Querying Firestore for user:', uid);
    const doc = await admin.firestore().doc(`users/${uid}/subscription/main`).get();

    if (!doc.exists) {
      console.log('No subscription found for user:', uid);
      const response = { subscription: null, hasSubscription: false };
      console.log('Returning response:', response);
      return res.status(200).json(response);
    }

    const subscription = doc.data();
    console.log('Found subscription:', subscription);

    // Verificar si la suscripción sigue activa
    const now = new Date();
    const expiryDate = new Date(subscription.expiryDate);

    if (expiryDate < now) {
      console.log('Subscription expired, updating status');
      // Marcar como expirada
      await doc.ref.update({ status: 'expired' });
      subscription.status = 'expired';
    }

    const response = { subscription, hasSubscription: true };
    console.log('Returning active subscription response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

exports.subscriptionWebhook = functions.https.onRequest(async (req, res) => {
  console.log('🔔 Webhook recibido');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Method:', req.method);

  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  try {
    // Validar si hay datos del pago
    const payment = req.body.data && req.body.data.id ? req.body.data : null;
    if (!payment) {
      console.log('❌ No payment data found');
      return res.status(400).send('Webhook received but no valid data');
    }

    console.log('💳 Processing payment ID:', payment.id);

    // Obtener detalles del pago
    const mp = require('mercadopago');
    mp.configure({ access_token: process.env.MP_ACCESS_TOKEN || functions.config().mercadopago?.access_token });

    const paymentInfo = await mp.payment.findById(payment.id);
    console.log('📋 Payment info:', JSON.stringify(paymentInfo.body, null, 2));

    const { external_reference, status, date_approved } = paymentInfo.body;

    console.log(`🔍 External reference: ${external_reference}, Status: ${status}`);

    if (!external_reference) {
      console.log('❌ No external reference found');
      return res.status(200).send('No external reference');
    }

    if (status !== 'approved') {
      console.log(`⏳ Payment not approved yet. Status: ${status}`);
      return res.status(200).send('Payment not approved');
    }

    const [uid, planId] = external_reference.split(':');
    const plan = { monthly: 1, semiannual: 6, annual: 12 }[planId];

    if (!plan) {
      console.log('❌ Invalid plan:', planId);
      return res.status(400).send('Invalid plan');
    }

    const start = new Date(date_approved);
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + plan);

    console.log(`✅ Creating subscription for user ${uid}, plan ${planId}`);
    console.log(`📅 Start: ${start.toISOString()}, Expiry: ${expiry.toISOString()}`);

    const subscriptionData = {
      plan: planId,
      startDate: start.toISOString(),
      expiryDate: expiry.toISOString(),
      status: 'active',
      paymentId: payment.id,
      amount: getPlanPrice(planId),
      createdAt: admin.firestore.Timestamp.now()
    };

    // Verificar si ya existe una suscripción activa
    const existingSubDoc = await admin.firestore().doc(`users/${uid}/subscription/main`).get();

    if (existingSubDoc.exists) {
      const existingSub = existingSubDoc.data();
      console.log('Found existing subscription, moving to history:', existingSub);

      // Mover la suscripción anterior al historial antes de crear la nueva
      const oldHistoryId = `${Date.now() - 1000}_${existingSub.paymentId || 'old'}`;
      await admin.firestore().doc(`users/${uid}/subscription/${oldHistoryId}`).set({
        ...existingSub,
        type: 'payment',
        movedToHistory: admin.firestore.Timestamp.now()
      });

      console.log('Previous subscription moved to history with ID:', oldHistoryId);
    }

    // Actualizar la suscripción principal
    await admin.firestore().doc(`users/${uid}/subscription/main`).set(subscriptionData, { merge: true });

    // Crear entrada en el historial con timestamp único
    const historyId = `${Date.now()}_${payment.id}`;
    await admin.firestore().doc(`users/${uid}/subscription/${historyId}`).set({
      ...subscriptionData,
      type: 'payment',
      transactionId: payment.id
    });

    // Determinar el rol según el plan
    let newRole = null;
    if (planId === 'monthly') {
      newRole = 'subscriber:monthly';
    } else if (planId === 'unlimited') {
      newRole = 'subscriber:unlimited';
    }

    // Actualizar el rol del usuario si corresponde
    if (newRole) {
      await admin.firestore().doc(`users/${uid}`).set({
        role: newRole,
        updatedAt: admin.firestore.Timestamp.now()
      }, { merge: true });
      console.log(`Rol actualizado a ${newRole} para el usuario ${uid}`);
    }

    console.log('🎉 Subscription and history created successfully');
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Función para obtener el historial de suscripciones del usuario
exports.getSubscriptionHistory = functions.https.onRequest(async (req, res) => {
  console.log('getSubscriptionHistory called with method:', req.method);
  console.log('getSubscriptionHistory URL:', req.url);

  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS request');
    return res.status(200).send('');
  }

  // Obtener UID de query parameter
  let uid = req.query.uid;

  if (!uid) {
    console.log('Invalid UID, returning 400');
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    console.log('Querying Firestore for subscription history:', uid);

    // Obtener todas las entradas de suscripción (incluyendo la principal y el historial)
    const subscriptionSnapshot = await admin.firestore()
      .collection(`users/${uid}/subscription`)
      .get(); // Removemos orderBy para hacer nuestro propio ordenamiento

    const history = [];

    subscriptionSnapshot.forEach(doc => {
      const data = doc.data();

      // Solo incluir documentos que tengan información de suscripción válida
      if (data.plan && data.startDate && data.expiryDate) {
        const now = new Date();
        const expiryDate = new Date(data.expiryDate);
        let status = data.status || 'active';

        if (expiryDate < now && status === 'active') {
          status = 'expired';
        }

        history.push({
          id: doc.id,
          plan: data.plan,
          status: status,
          startDate: data.startDate,
          expiryDate: data.expiryDate,
          amount: data.amount || getPlanPrice(data.plan),
          paymentId: data.paymentId || data.transactionId,
          type: data.type || (doc.id === 'main' ? 'subscription' : 'payment'),
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(data.startDate)
        });
      }
    });

    // Ordenar por fecha de inicio descendente (más reciente primero)
    history.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // Si no hay historial, crear uno simulado basado en la suscripción actual (para testing)
    if (history.length === 0) {
      const mainDoc = await admin.firestore().doc(`users/${uid}/subscription/main`).get();

      if (mainDoc.exists) {
        const currentSub = mainDoc.data();
        const now = new Date();
        const expiryDate = new Date(currentSub.expiryDate);
        let status = currentSub.status || 'active';

        if (expiryDate < now && status === 'active') {
          status = 'expired';
        }

        history.push({
          id: 'main',
          plan: currentSub.plan,
          status: status,
          startDate: currentSub.startDate,
          expiryDate: currentSub.expiryDate,
          amount: getPlanPrice(currentSub.plan),
          paymentId: currentSub.paymentId,
          type: 'subscription'
        });
      }
    }

    console.log(`Found ${history.length} subscription history entries`);
    console.log('Returning subscription history:', history);
    res.status(200).json({ history });
  } catch (error) {
    console.error('Error getting subscription history:', error);
    res.status(500).json({ error: 'Internal server error', history: [] });
  }
});

// Función auxiliar para obtener el precio del plan
function getPlanPrice(planId) {
  const prices = {
    'monthly': 3000,
    'semiannual': 15300,
    'annual': 27000
  };
  return prices[planId] || 0;
}
