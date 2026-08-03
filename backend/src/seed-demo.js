const bcrypt = require('bcryptjs');
const { getData, setData } = require('./database');

function seedDemo() {
  const data = getData();

  if (data.users.length > 1) {
    console.log('Demo data already exists. Skipping.');
    return;
  }

  const now = new Date();

  // Sample users
  const users = [
    { email: 'john@example.com', password: 'password123', first_name: 'John', last_name: 'Doe', tier: 'pro', status: 'active' },
    { email: 'jane@example.com', password: 'password123', first_name: 'Jane', last_name: 'Smith', tier: 'enterprise', status: 'active' },
    { email: 'bob@example.com', password: 'password123', first_name: 'Bob', last_name: 'Johnson', tier: 'free', status: 'inactive' },
    { email: 'alice@example.com', password: 'password123', first_name: 'Alice', last_name: 'Williams', tier: 'pro', status: 'active' },
    { email: 'charlie@example.com', password: 'password123', first_name: 'Charlie', last_name: 'Brown', tier: 'free', status: 'inactive' },
  ];

  users.forEach((u, i) => {
    const created = new Date(now.getTime() - (i + 1) * 2 * 24 * 60 * 60 * 1000);
    data.users.push({
      id: data.users.length + 1,
      email: u.email,
      password_hash: bcrypt.hashSync(u.password, 10),
      first_name: u.first_name,
      last_name: u.last_name,
      role: 'user',
      subscription_tier: u.tier,
      subscription_status: u.status,
      stripe_customer_id: `cus_${Math.random().toString(36).substring(2)}`,
      created_at: created.toISOString(),
      updated_at: created.toISOString()
    });
  });

  // Sample resumes
  const resumes = [
    { user_id: 2, title: 'Software Engineer Resume', content: JSON.stringify({ summary: 'Experienced dev...', experience: [] }), template_id: 'cipher', ats_score: 85 },
    { user_id: 2, title: 'Product Manager CV', content: JSON.stringify({ summary: 'PM with 5 years...', experience: [] }), template_id: 'aurelius', ats_score: 92 },
    { user_id: 3, title: 'Design Portfolio', content: JSON.stringify({ summary: 'Creative designer...', experience: [] }), template_id: 'nova', ats_score: 78 },
    { user_id: 4, title: 'Data Scientist Resume', content: JSON.stringify({ summary: 'ML expert...', experience: [] }), template_id: 'cipher', ats_score: 88 },
  ];

  resumes.forEach((r, i) => {
    data.resumes.push({
      id: data.resumes.length + 1,
      user_id: r.user_id,
      title: r.title,
      content: r.content,
      template_id: r.template_id,
      ats_score: r.ats_score,
      is_public: 0,
      created_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  // Sample payments/orders
  const payments = [
    { user_id: 2, amount: 2900, currency: 'usd', status: 'succeeded', tier: 'pro', description: 'Pro Monthly Subscription' },
    { user_id: 3, amount: 2900, currency: 'usd', status: 'succeeded', tier: 'pro', description: 'Pro Monthly Subscription' },
    { user_id: 3, amount: 9900, currency: 'usd', status: 'succeeded', tier: 'enterprise', description: 'Enterprise Annual' },
    { user_id: 4, amount: 2900, currency: 'usd', status: 'succeeded', tier: 'pro', description: 'Pro Monthly Subscription' },
    { user_id: 5, amount: 2900, currency: 'usd', status: 'failed', tier: 'pro', description: 'Pro Monthly Subscription' },
    { user_id: 2, amount: 2900, currency: 'usd', status: 'succeeded', tier: 'pro', description: 'Pro Monthly Subscription' },
  ];

  payments.forEach((p, i) => {
    data.payments.push({
      id: data.payments.length + 1,
      user_id: p.user_id,
      stripe_payment_intent_id: `pi_${Math.random().toString(36).substring(2)}`,
      stripe_subscription_id: `sub_${Math.random().toString(36).substring(2)}`,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      tier: p.tier,
      description: p.description,
      created_at: new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  setData(data);
  console.log('Demo data seeded:');
  console.log(`  Users: ${users.length}`);
  console.log(`  Resumes: ${resumes.length}`);
  console.log(`  Payments: ${payments.length}`);
}

seedDemo();
