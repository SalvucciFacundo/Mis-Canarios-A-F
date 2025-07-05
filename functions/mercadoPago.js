// Cargar variables de entorno en desarrollo
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const mercadopago = require('mercadopago');
const functions = require('firebase-functions');

// Configurar MercadoPago con el token de acceso
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN || functions.config().mercadopago?.access_token
});

const plans = {
  monthly: { price: 3000, months: 1, title: 'Suscripción Mensual' }, // $3000 ARS
  semiannual: { price: 15300, months: 6, title: 'Suscripción Semestral' }, // $15300 ARS (15% descuento)
  annual: { price: 27000, months: 12, title: 'Suscripción Anual' }, // $27000 ARS (25% descuento)
};

exports.createPreference = async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    // Verificar credenciales de Mercado Pago
    const accessToken = process.env.MP_ACCESS_TOKEN || functions.config().mercadopago?.access_token;
    if (!accessToken || accessToken.includes('EJEMPLO') || accessToken.includes('NO-FUNCIONA')) {
      console.error('❌ Credenciales de Mercado Pago no configuradas');
      return res.status(500).json({
        error: 'Credenciales de Mercado Pago no configuradas. Ve a la guía para obtener tus credenciales reales.',
        needsConfiguration: true
      });
    }

    const { planId, uid } = req.body;
    if (!plans[planId] || !uid) {
      return res.status(400).json({ error: 'Invalid plan or user' });
    }

    const plan = plans[planId];
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:5010/mis-canarios-579c4/us-central1';

    console.log('Creating preference for plan:', planId, plan);
    console.log('App URL:', appUrl);
    console.log('Webhook URL:', webhookUrl);

    const preference = {
      items: [{
        title: plan.title,
        quantity: 1,
        currency_id: 'ARS', // Cambiar a pesos argentinos
        unit_price: plan.price,
      }],
      external_reference: `${uid}:${planId}`,
      back_urls: {
        success: `${appUrl}/subscription/success`,
        failure: `${appUrl}/subscription/error`,
        pending: `${appUrl}/subscription/pending`,
      },
      metadata: { uid, planId },
      notification_url: `${webhookUrl}/subscriptionWebhook`,
      // Configuraciones adicionales para reducir errores
      payer: {
        name: "Usuario Test",
        surname: "MP",
        email: "test_user_123@testuser.com"
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 1
      },
      // Configuración de idioma para evitar warnings
      locale: 'es-AR'
    };

    console.log('Preference object:', JSON.stringify(preference, null, 2));

    const result = await mercadopago.preferences.create(preference);
    res.json({ init_point: result.body.init_point });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Error creating payment preference' });
  }
};
