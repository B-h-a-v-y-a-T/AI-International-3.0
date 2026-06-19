const fs = require('fs');
let file = 'learning.html';
let html = fs.readFileSync(file, 'utf8');

const regex = /<!-- Center Column: Node Path -->[\s\S]*?(?=<!-- Right Column)/;

const newHTML = `<!-- Center Column: Node Path -->
<style>
@keyframes blinkGradient {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
}
.node-loc {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}
.node-label {
  position: absolute;
  font-weight: 700;
  color: #4b5563;
  font-size: 14px;
  white-space: nowrap;
}
</style>

<div style="position: relative; width: 100%; height: 750px; display: flex; justify-content: center;">
    <!-- SVG Container -->
    <div style="position: absolute; width: 280px; height: 750px; top: 0; left: 50%; transform: translateX(-50%);">
        <svg viewBox="0 0 280 750" style="width: 100%; height: 100%; z-index: 0; pointer-events: none;">
            <!-- Thick solid green path -->
            <path d="M 140 40
                     C 30 100, 30 160, 100 240
                     C 180 320, 240 360, 200 420"
                  fill="none" stroke="#22c55e" stroke-width="12" stroke-linecap="round" />

            <!-- Semi-transparent purple path -->
            <path d="M 200 420
                     C 160 480, 100 520, 140 580
                     C 180 640, 200 680, 180 720"
                  fill="none" stroke="#e9d5ff" stroke-width="12" stroke-linecap="round" />
        </svg>

        <!-- Node 1: Completed (Left) -->
        <div class="node-loc" style="top: 140px; left: 60px; z-index: 2;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: #22c55e; display: flex; justify-content: center; align-items: center; box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span class="node-label" style="top: -40px; left: -20px;">Limits & Continuity</span>
        </div>

        <!-- Node 2: Completed (Right) -->
        <div class="node-loc" style="top: 290px; left: 180px; z-index: 2;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: #22c55e; display: flex; justify-content: center; align-items: center; box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span class="node-label" style="right: 85px; top: -10px;">The Power Rule</span>
        </div>

        <!-- Node 3: Active Star (Intermediate Right-Center) -->
        <div class="node-loc" style="top: 450px; left: 160px; z-index: 2;">
            <!-- Blinking animated ring -->
            <div style="position: absolute; width: 140px; height: 140px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(99, 102, 241, 0.3)); border-radius: 50%; z-index: -1; top: 50%; left: 50%; animation: blinkGradient 2s infinite ease-in-out;"></div>
            <!-- Star Core -->
            <div style="width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #6366f1); display: flex; justify-content: center; align-items: center; box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5); border: 4px solid white;">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            
            <!-- Floating Text to the Right -->
            <div style="position: absolute; left: 80px; top: -30px; display: flex; flex-direction: column; white-space: nowrap; z-index: 10;">
                <span class="node-label" style="position: relative; font-weight: 800; color: #1e1b4b; font-size: 16px;">Intro to Derivatives</span>
                <span style="color: #6366f1; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; margin-top: 4px;">ACTIVE MODULE</span> 
            </div>
        </div>

        <!-- Node 4: Locked (Left) -->
        <div class="node-loc" style="top: 610px; left: 90px; z-index: 2;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: white; border: 3px solid #e5e7eb; display: flex; justify-content: center; align-items: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <span class="node-label" style="left: 80px; top: 15px;">Chain Rule Mastery</span>
        </div>

        <!-- Node 5: Locked (Right) -->
        <div class="node-loc" style="top: 730px; left: 160px; z-index: 2;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: white; border: 3px solid #e5e7eb; display: flex; justify-content: center; align-items: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <span class="node-label" style="right: 80px;">Quotient Rule</span>
        </div>
    </div>
</div>

                  `;

const newDoc = html.replace(regex, newHTML);
fs.writeFileSync(file, newDoc);
console.log('Successfully updated learning.html layout and animations.');
