// ═══════════════════════════════════════════════════════
//  OTO – Order Today Online | WhatsApp Bot Server
//  Direct Meta API | No third party | Free 1000 conv/month
// ═══════════════════════════════════════════════════════

const express = require('express');
const app = express();
app.use(express.json());

// ─── YOUR CREDENTIALS (fill these) ───────────────────
const CONFIG = {
  VERIFY_TOKEN:    'oto2024secret',           // you choose any string
  ACCESS_TOKEN:    'EAF6UOrwCtnwBQ8YaGBq2sZBAzNtesJaa1A5Ry5UKHq2GN140qzHVUubZB9dEx2BGKfUDoEW8BbvTYaygxIL2xuSHSqKhbhB7j97YTQ47s1pP1JIUOJQ1bRgGFNIHrvTCQHQ42d2WmJErCQUKuRF2NMX1PB56hyZA9F7x501ZAiZAdOm51lTqCZBDAZBaE6yBStEZCg1WQW6ZAyaGZAL6dMOCxE5p12BbTz2O2aC7TAhcrSTHFbJMZCDuCe0WrhWIUmoeSxZCxk6yuAEj5JCmk3xWaOlNIR7zyQZDZD', // from Meta dashboard
  PHONE_NUMBER_ID: '1054668754393045',          // already on your screen!
  WEBVIEW_URL:     'https://peppy-narwhal-b70af2.netlify.app/', // after Netlify upload
};
// ─────────────────────────────────────────────────────

const WHATSAPP_API = `https://graph.facebook.com/v19.0/${CONFIG.PHONE_NUMBER_ID}/messages`;

// ═══════════════════════════════════════════════════════
//  STEP 1: WEBHOOK VERIFICATION (Meta calls this once)
// ═══════════════════════════════════════════════════════
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// ═══════════════════════════════════════════════════════
//  STEP 2: RECEIVE INCOMING MESSAGES
// ═══════════════════════════════════════════════════════
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Always reply 200 to Meta first

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) return;

    const msg     = messages[0];
    const from    = msg.from;       // customer's phone number
    const msgType = msg.type;       // text, interactive, etc.
    const msgText = msg.text?.body?.toLowerCase().trim() || '';

    console.log(`📩 Message from ${from}: "${msgText}"`);

    // ─── ROUTE MESSAGES ───────────────────────────────
    if (msgType === 'text') {
      await handleTextMessage(from, msgText);
    } else if (msgType === 'interactive') {
      await handleInteractiveMessage(from, msg.interactive);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});

// ═══════════════════════════════════════════════════════
//  STEP 3: MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════

async function handleTextMessage(to, text) {

  // GREETING — send main menu with CTA button
  if (['hi','hello','hey','hy','helo','namaste','namaskar','order','start','oto'].includes(text)) {
    await sendWelcomeMenu(to);
    return;
  }

  // VENDOR keyword
  if (text.includes('vendor') || text.includes('register') || text.includes('business')) {
    await sendVendorInfo(to);
    return;
  }

  // HELP keyword
  if (text.includes('help') || text.includes('support')) {
    await sendHelpMessage(to);
    return;
  }

  // TRACK keyword
  if (text.includes('track') || text.includes('order')) {
    await sendTrackingInfo(to);
    return;
  }

  // DEFAULT — unknown message, send menu again
  await sendWelcomeMenu(to);
}

async function handleInteractiveMessage(to, interactive) {
  const buttonId = interactive?.button_reply?.id || interactive?.list_reply?.id || '';

  if (buttonId === 'open_app') {
    await sendWebViewButton(to);
  } else if (buttonId === 'register_vendor') {
    await sendVendorInfo(to);
  } else if (buttonId === 'call_support') {
    await sendHelpMessage(to);
  }
}

// ═══════════════════════════════════════════════════════
//  STEP 4: MESSAGE TEMPLATES
// ═══════════════════════════════════════════════════════

// 1. WELCOME MENU with interactive buttons
async function sendWelcomeMenu(to) {
  await sendMessage(to, {
    type: 'interactive',
    interactive: {
      type: 'button',
      header: {
        type: 'text',
        text: '🚀 OTO – Order Today Online'
      },
      body: {
        text: `👋 *Namaste! Welcome to OTO Indapur!*\n\nEverything your city needs 📍\n\n🍕 Food Delivery\n🛒 Grocery & Kirana\n🔧 Home Services (Plumber, Electrician)\n🚗 Rides & Transport\n💊 Medicine Delivery\n🎉 Events & 25+ more!\n\n⚡ *Order in 30 seconds — No app needed!*`
      },
      footer: {
        text: '📍 Serving Indapur & nearby areas'
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: { id: 'open_app', title: '🛍️ Browse & Order' }
          },
          {
            type: 'reply',
            reply: { id: 'register_vendor', title: '🏪 I\'m a Vendor' }
          },
          {
            type: 'reply',
            reply: { id: 'call_support', title: '📞 Support' }
          }
        ]
      }
    }
  });
}

// 2. WEBVIEW BUTTON — opens OTO mini-app
async function sendWebViewButton(to) {
  await sendMessage(to, {
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: {
        text: `🔥 *OTO – Everything Your City Needs!*\n\n✅ 25+ services available\n✅ Local vendors in Indapur\n✅ Order in 30 seconds\n✅ Cash or UPI payment\n\n👇 Tap the button to start ordering:`
      },
      footer: {
        text: '🎉 Free delivery on first order! Code: OTO1ST'
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: '🛍️ Open OTO & Order Now',
          url: CONFIG.WEBVIEW_URL
        }
      }
    }
  });
}

// 3. VENDOR REGISTRATION INFO
async function sendVendorInfo(to) {
  await sendMessage(to, {
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: {
        text: `🏪 *Join OTO as a Vendor!*\n\n💰 *Plans starting at just ₹99*\n\n✅ ₹99 — Registration + 15-day trial\n✅ ₹150/month — Starter (5 orders/day)\n✅ ₹500/month — Growth (15 orders/day) ⭐\n✅ ₹1,500/month — Pro (40 orders/day)\n✅ ₹5,000/month — Enterprise (Unlimited)\n\n📲 *What you get:*\n• WhatsApp order notifications\n• Vendor dashboard\n• Free marketing on social media\n• 500+ customers reach from day 1\n\n👇 Tap to register now:`
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: '🚀 Register as Vendor — ₹99',
          url: `${CONFIG.WEBVIEW_URL}#vendor`
        }
      }
    }
  });
}

// 4. HELP / SUPPORT
async function sendHelpMessage(to) {
  await sendMessage(to, {
    type: 'text',
    text: {
      body: `📞 *OTO Support Team*\n\n🕐 Available: 8 AM – 10 PM\n\n📱 WhatsApp: wa.me/919370349961\n📧 Email: support@ordertodayonline.in\n📍 Indapur, Maharashtra\n\n*Common Help:*\n• Reply *TRACK* to track your order\n• Reply *VENDOR* to register your business\n• Reply *HI* to go back to main menu\n\n💬 Or describe your issue and we'll help!`
    }
  });
}

// 5. ORDER TRACKING
async function sendTrackingInfo(to) {
  await sendMessage(to, {
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: {
        text: `📍 *Track Your OTO Order*\n\nYour recent order status:\n\n✅ Order Confirmed — #OTO-IND-1247\n👨‍🍳 Restaurant Preparing...\n🛵 Delivery partner being assigned\n\n⏱ Estimated time: 25-30 minutes\n\n👇 Tap for live tracking:`
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: '📍 Track Live Order',
          url: `${CONFIG.WEBVIEW_URL}#track`
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════
//  STEP 5: SEND MESSAGE HELPER
// ═══════════════════════════════════════════════════════
async function sendMessage(to, messageContent) {
  try {
    const response = await fetch(WHATSAPP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                to,
        ...messageContent
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ WhatsApp API Error:', data.error.message);
    } else {
      console.log(`✅ Message sent to ${to} | ID: ${data.messages?.[0]?.id}`);
    }

    return data;
  } catch (err) {
    console.error('❌ Send failed:', err.message);
  }
}

// ═══════════════════════════════════════════════════════
//  STEP 6: HEALTH CHECK ROUTE
// ═══════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    status: '✅ OTO WhatsApp Bot is LIVE!',
    bot: 'Order Today Online',
    city: 'Indapur, Maharashtra',
    time: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🚀 OTO WhatsApp Bot — RUNNING      ║
  ║   Port: ${PORT}                          ║
  ║   Webhook: /webhook                  ║  
  ║   Health: /                          ║
  ╚══════════════════════════════════════╝
  `);
});
