/**
 * test_swarm.js — Test script for the 7-Agent AI Swarm Agency
 * 
 * Usage:
 *   node test_swarm.js
 *   node test_swarm.js "Your custom objective here"
 */

const WEBHOOK_URL = 'https://dipmane.app.n8n.cloud/webhook/ai-swarm-agency';

const DEFAULT_OBJECTIVE = 'Design and plan a secure, serverless URL Shortener service with a real-time analytics dashboard, custom branded domains support, and a REST API for developers.';

async function runSwarm(objective) {
  console.log('🤖 7-Agent AI Swarm Agency — Test Runner');
  console.log('═'.repeat(60));
  console.log(`📋 Objective: ${objective}`);
  console.log(`🌐 Webhook:   ${WEBHOOK_URL}`);
  console.log('═'.repeat(60));
  console.log('⏳ Sending objective to swarm... (this may take 30-90 seconds)\n');

  const startTime = Date.now();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}: ${errorText}`);
      console.error(`⏱️  Failed after ${elapsed}s`);
      process.exit(1);
    }

    const data = await response.json();

    console.log('✅ Swarm completed successfully!');
    console.log(`⏱️  Execution time: ${elapsed}s`);
    console.log('═'.repeat(60));

    if (data.success && data.report) {
      const report = data.report;
      console.log(`📄 Title:          ${report.title}`);
      console.log(`📊 Word Count:     ${report.word_count}`);
      console.log(`📑 Sections:       ${report.sections_count}`);
      console.log(`🤖 Agents Used:    ${report.agent_count}`);
      console.log(`🕐 Generated At:   ${report.generated_at}`);
      console.log('═'.repeat(60));

      if (report.sections && report.sections.length > 0) {
        console.log('\n📋 SECTION OVERVIEW:\n');
        report.sections.forEach((section, i) => {
          const preview = section.body.substring(0, 120).replace(/\n/g, ' ');
          console.log(`  ${i + 1}. ${section.title}`);
          console.log(`     ${preview}...`);
          console.log('');
        });
      }

      console.log('═'.repeat(60));
      console.log('\n📝 FULL RAW MARKDOWN OUTPUT:\n');
      console.log(report.raw_markdown);
    } else {
      console.log('\n📦 Raw Response:\n');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n❌ Error after ${elapsed}s: ${error.message}`);

    if (error.message.includes('fetch')) {
      console.error('\n💡 Tip: Make sure the n8n workflow is Active and the webhook URL is correct.');
    }

    process.exit(1);
  }
}

// Run with custom objective from CLI args, or use default
const objective = process.argv[2] || DEFAULT_OBJECTIVE;
runSwarm(objective);
