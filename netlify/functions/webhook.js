const crypto = require('crypto');

const SUPABASE_URL = 'https://roavrwtxdqyhpwiuquvz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYkFTRSIsImZlIjoicm9hdnJ3dHhkaXFocHdpdXF2eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgwODQxNzA2LCJleHAiOjIwOTY0MTc3MDZ5.T6U9LolX_BPdKFOLGk9JLC9WUYhdJEvHN8kKRhBwE8U';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const payload = JSON.parse(event.body);
    const eventName = payload.meta?.event_name;
    if (eventName !== 'order_created') return { statusCode: 200, body: 'OK' };

    const orderId = String(payload.data?.id);
    const email = (payload.data?.attributes?.user_email || '').toLowerCase().trim();
    if (!email) return { statusCode: 400, body: 'No email' };

    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/access_tokens?email=eq.${encodeURIComponent(email)}&select=id`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/access_tokens?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ order_id: orderId, uses: 0 })
      });
    } else {
      const crypto = require('crypto');
      await fetch(`${SUPABASE_URL}/rest/v1/access_tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ email, order_id: orderId, token: crypto.randomBytes(16).toString('hex') })
      });
    }

    console.log(`Access granted to: ${email}`);
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: 'Error' };
  }
};