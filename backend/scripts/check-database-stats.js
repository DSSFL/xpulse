import { database } from '../src/database.js';

async function checkStats() {
  try {
    console.log('📊 DATABASE STATISTICS\n');
    console.log('🔌 Connecting to database...');

    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const client = await database.pool.connect();

    // Total posts
    const totalResult = await client.query('SELECT COUNT(*) as count FROM user_posts');
    console.log(`\n📝 Total Posts: ${totalResult.rows[0].count}`);

    // By tweet type
    const typeResult = await client.query(`
      SELECT tweet_type, COUNT(*) as count
      FROM user_posts
      GROUP BY tweet_type
      ORDER BY count DESC;
    `);
    console.log('\n📋 By Type:');
    typeResult.rows.forEach(row => {
      console.log(`   ${row.tweet_type}: ${row.count}`);
    });

    // Geographic posts
    const geoResult = await client.query(`
      SELECT COUNT(*) as count FROM user_posts WHERE has_geo = true;
    `);
    console.log(`\n🗺️  Geo-tagged Posts: ${geoResult.rows[0].count}`);

    // Unique states
    const statesResult = await client.query(`
      SELECT geo_full_name, COUNT(*) as count,
             AVG(author_account_age_days) as avg_age
      FROM user_posts
      WHERE has_geo = true AND geo_full_name LIKE '%USA'
      GROUP BY geo_full_name
      ORDER BY count DESC;
    `);
    console.log(`\n🏛️  States with Data: ${statesResult.rows.length}`);
    statesResult.rows.forEach(row => {
      const avgAge = row.avg_age ? Math.round(row.avg_age) : 'N/A';
      const botRisk = row.avg_age && row.avg_age < 30 ? '🚨' : '';
      console.log(`   ${row.geo_full_name}: ${row.count} posts | Avg Account Age: ${avgAge}d ${botRisk}`);
    });

    // Cities with most activity
    const citiesResult = await client.query(`
      SELECT geo_full_name, COUNT(*) as count,
             AVG(author_account_age_days) as avg_age,
             SUM(CASE WHEN author_account_age_days < 7 THEN 1 ELSE 0 END) as very_new_accounts,
             SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count
      FROM user_posts
      WHERE has_geo = true
        AND geo_full_name NOT LIKE '%USA'
        AND geo_full_name IS NOT NULL
      GROUP BY geo_full_name
      HAVING COUNT(*) >= 5
      ORDER BY count DESC
      LIMIT 15;
    `);
    console.log(`\n🌆 Top Cities (potential bot farm hotspots):`);
    citiesResult.rows.forEach((row, idx) => {
      const avgAge = row.avg_age ? Math.round(row.avg_age) : 'N/A';
      const botScore = calculateBotScore(row);
      const botWarning = botScore >= 40 ? '🚨 HIGH RISK' : botScore >= 20 ? '⚠️  MEDIUM' : '';
      console.log(`   ${idx + 1}. ${row.geo_full_name}`);
      console.log(`      Posts: ${row.count} | Very New Accounts: ${row.very_new_accounts} | Avg Age: ${avgAge}d`);
      console.log(`      Negative: ${row.negative_count} | Bot Score: ${botScore}/100 ${botWarning}`);
    });

    // Tracked users
    const usersResult = await client.query('SELECT * FROM tracked_users ORDER BY id');
    console.log(`\n👥 Tracked Users: ${usersResult.rows.length}`);
    usersResult.rows.forEach(row => {
      console.log(`   ${row.display_name} (@${row.username}) - ${row.followers_count.toLocaleString()} followers`);
    });

    // Sentiment breakdown
    const sentimentResult = await client.query(`
      SELECT sentiment, COUNT(*) as count
      FROM user_posts
      GROUP BY sentiment
      ORDER BY count DESC;
    `);
    console.log('\n😊 Sentiment Analysis:');
    sentimentResult.rows.forEach(row => {
      const emoji = row.sentiment === 'positive' ? '😊' : row.sentiment === 'negative' ? '😠' : '😐';
      console.log(`   ${emoji} ${row.sentiment}: ${row.count}`);
    });

    client.release();
    await database.close();

    console.log('\n✅ Database is fully populated and ready!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await database.close();
    process.exit(1);
  }
}

function calculateBotScore(data) {
  const totalPosts = parseInt(data.count);
  const veryNewAccounts = parseInt(data.very_new_accounts);
  const avgAge = parseFloat(data.avg_age);
  const negativeCount = parseInt(data.negative_count);

  let score = 0;

  // Very new accounts (< 7 days)
  const veryNewPct = (veryNewAccounts / totalPosts) * 100;
  score += Math.min(veryNewPct, 30);

  // Average account age
  if (avgAge < 30) {
    score += Math.min(((30 - avgAge) / 30) * 40, 40);
  }

  // High post velocity
  if (totalPosts > 10) {
    score += Math.min((totalPosts / 10) * 2, 20);
  }

  // Negative sentiment clustering
  const negativeRatio = negativeCount / totalPosts;
  if (negativeRatio > 0.3) {
    score += 10;
  }

  return Math.min(Math.round(score), 100);
}

checkStats();
