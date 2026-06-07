const SUPABASE_URL = 'https://roavrwtxdqyhpwiuquvz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYXZyd3R4ZHF5aHB3aXVxdXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDE3MDYsImV4cCI6MjA5NjQxNzcwNn0.T6U9LolX_BPdKFOLGk9JLC9WUYhdJEvHN8kKRhBwE8U';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { email } = JSON.parse(event.body);
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };

    const normalizedEmail = email.toLowerCase().trim();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/access_tokens?email=eq.${encodeURIComponent(normalizedEmail)}&select=id,email,uses`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();

    if (!data || data.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ access: false }) };
    }

    await fetch(`${SUPABASE_URL}/rest/v1/access_tokens?id=eq.${data[0].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ uses: (data[0].uses || 0) + 1 })
    });

    return { statusCode: 200, headers, body: JSON.stringify({ access: true, email: normalizedEmail }) };
  } catch (err) {
    console.error('Login error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
