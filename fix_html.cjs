const fs = require('fs');

let html = fs.readFileSync('ai-tutor.html', 'utf8');

// Replace Mode Tabs Emojis
html = html.replace('<span class="tab-icon">💬</span>', '<i data-lucide="message-square" style="width:16px;height:16px;margin-right:6px"></i>');
html = html.replace('<span class="tab-icon">📚</span>', '<i data-lucide="book-open" style="width:16px;height:16px;margin-right:6px"></i>');
html = html.replace('<span class="tab-icon">🏋️</span>', '<i data-lucide="dumbbell" style="width:16px;height:16px;margin-right:6px"></i>');
html = html.replace('<span class="tab-icon">📝</span>', '<i data-lucide="file-edit" style="width:16px;height:16px;margin-right:6px"></i>');
html = html.replace('<span class="tab-icon">⏱️</span>', '<i data-lucide="timer" style="width:16px;height:16px;margin-right:6px"></i>');

// Replace inner emojis
html = html.replace('<span>🟢 Risk Level: LOW</span>', '<span><i data-lucide="check-circle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;color:#22C55E"></i> Risk Level: LOW</span>');
html = html.replace('<span class="streak-flame">❄️</span>', '<span class="streak-flame"><i data-lucide="snowflake" style="width:24px;height:24px;color:#3B82F6"></i></span>');

// Replace Dashboard Cards with <details> and <summary>
html = html.replace(/<div class="tutor-dash-card">/g, '<details class="tutor-dash-card" open>');
html = html.replace(/<div class="tutor-dash-card-header">📊 Overview<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="bar-chart-2" style="width:16px;height:16px"></i> Overview</summary>');
html = html.replace(/<div class="tutor-dash-card-header">🔥 Study Streak<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="flame" style="width:16px;height:16px;color:#F97316"></i> Study Streak</summary>');
html = html.replace(/<div class="tutor-dash-card-header">⚠️ Risk Level<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="alert-triangle" style="width:16px;height:16px;color:#EAB308"></i> Risk Level</summary>');
html = html.replace(/<div class="tutor-dash-card-header">🗺️ Mastery Heatmap<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="map" style="width:16px;height:16px;color:#3B82F6"></i> Mastery Heatmap</summary>');
html = html.replace(/<div class="tutor-dash-card-header">🔴 Weak Topics<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="circle-dot" style="width:16px;height:16px;color:#EF4444"></i> Weak Topics</summary>');
html = html.replace(/<div class="tutor-dash-card-header">🟢 Strong Topics<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="circle-dot" style="width:16px;height:16px;color:#22C55E"></i> Strong Topics</summary>');
html = html.replace(/<div class="tutor-dash-card-header">📈 Daily Progress<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="trending-up" style="width:16px;height:16px;color:#8B5CF6"></i> Daily Progress</summary>');
html = html.replace(/<div class="tutor-dash-card-header">📉 Confidence Trend<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="trending-down" style="width:16px;height:16px;color:#F43F5E"></i> Confidence Trend</summary>');
html = html.replace(/<div class="tutor-dash-card-header">📋 Study Plan<\/div>/g, '<summary class="tutor-dash-card-header"><i data-lucide="clipboard-list" style="width:16px;height:16px;color:#64748B"></i> Study Plan</summary>');

// Replace the closing divs of the cards with </details>
// A dash card structure is:
// <details ...>
//   <summary ...>...</summary>
//   <div class="tutor-dash-card-body"...>
//     ...
//   </div>
// </div>  <-- THIS ONE
// Since we have nested divs, we need a bit of smart logic or just line replacements.

const lines = html.split('\n');
const cardEndLines = [129, 143, 154, 164, 172, 180, 190, 200, 214];
for (let i of cardEndLines) {
  // Adjusting for 0-index and verifying it's a </div>
  if (lines[i-1].includes('</div>')) {
     lines[i-1] = lines[i-1].replace('</div>', '</details>');
  }
}
html = lines.join('\n');

fs.writeFileSync('ai-tutor.html', html, 'utf8');
console.log('HTML updated.');
