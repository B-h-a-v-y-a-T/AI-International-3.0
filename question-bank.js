/* =====================================================
   Question Bank + Vector DB + Quiz Manager
   Fully offline, no API calls
===================================================== */

function qbReadShared(key, fallback) {
  try {
    if (window.DataAgent && typeof window.DataAgent.readCompat === "function") {
      return window.DataAgent.readCompat(key, fallback);
    }
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function qbWriteShared(key, value) {
  try {
    if (window.DataAgent && typeof window.DataAgent.writeCompat === "function") {
      window.DataAgent.writeCompat(key, value);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("[QuestionBank] Shared write failed for", key, e);
  }
}

// ─── QUESTION BANK ──────────────────────────────────
const QuestionBank = {
  "kinematics": [
    {id:"k1",question:"A ball is thrown vertically upward with velocity 20 m/s. What is the maximum height? (g=10 m/s²)",options:["20 m","10 m","40 m","5 m"],correctIndex:0,explanation:"h = u²/2g = 400/20 = 20 m",difficulty:"easy"},
    {id:"k2",question:"A car accelerates from rest at 2 m/s² for 5s. What distance does it cover?",options:["25 m","50 m","10 m","20 m"],correctIndex:0,explanation:"s = ½at² = ½×2×25 = 25 m",difficulty:"easy"},
    {id:"k3",question:"Two balls are thrown simultaneously: A vertically up at 20 m/s, B vertically down at 20 m/s from a 200m tower. Time difference to reach ground?",options:["4 s","0 s","2 s","6 s"],correctIndex:0,explanation:"Using equations of motion for both, time difference = 2u/g = 4s",difficulty:"hard"},
    {id:"k4",question:"A projectile is fired at 30° with initial velocity 40 m/s. What is the range? (g=10)",options:["80√3 m","160 m","80 m","40√3 m"],correctIndex:0,explanation:"R = u²sin2θ/g = 1600×sin60°/10 = 80√3 m",difficulty:"medium"},
    {id:"k5",question:"A body moves in a circle of radius 10 m with constant speed 5 m/s. What is the centripetal acceleration?",options:["2.5 m/s²","5 m/s²","10 m/s²","0.5 m/s²"],correctIndex:0,explanation:"a = v²/r = 25/10 = 2.5 m/s²",difficulty:"easy"},
    {id:"k6",question:"If velocity-time graph is a straight line with positive slope, the motion is:",options:["Uniformly accelerated","Uniform velocity","Decelerating","At rest"],correctIndex:0,explanation:"Positive slope in v-t graph means constant positive acceleration",difficulty:"easy"},
    {id:"k7",question:"A stone dropped from a balloon ascending at 10 m/s reaches ground in 8s. Height of balloon? (g=10)",options:["240 m","320 m","160 m","400 m"],correctIndex:0,explanation:"h = -ut + ½gt² = -10×8 + ½×10×64 = -80+320 = 240 m",difficulty:"medium"},
    {id:"k8",question:"The angle of projectile for maximum range is:",options:["45°","30°","60°","90°"],correctIndex:0,explanation:"R = u²sin2θ/g is max when sin2θ=1, i.e., θ=45°",difficulty:"easy"},
    {id:"k9",question:"A particle starts from rest and moves with acceleration a=2t. Velocity at t=3s is:",options:["9 m/s","6 m/s","12 m/s","3 m/s"],correctIndex:0,explanation:"v = ∫a dt = ∫2t dt = t² = 9 m/s at t=3",difficulty:"medium"},
    {id:"k10",question:"Two bodies of masses m and 2m are dropped from heights h and 2h. Ratio of times to reach ground:",options:["1:√2","1:2","√2:1","2:1"],correctIndex:0,explanation:"t = √(2h/g), ratio = √(h):√(2h) = 1:√2",difficulty:"medium"},
    {id:"k11",question:"A car moving at 72 km/h brakes and stops in 5s. What is the deceleration?",options:["4 m/s²","2 m/s²","8 m/s²","10 m/s²"],correctIndex:0,explanation:"72 km/h = 20 m/s, a = v/t = 20/5 = 4 m/s²",difficulty:"easy"},
    {id:"k12",question:"The displacement of a body in 4th second of motion starting from rest with uniform acceleration 2 m/s² is:",options:["7 m","8 m","4 m","6 m"],correctIndex:0,explanation:"s_nth = u + a(2n-1)/2 = 0 + 2(7)/2 = 7 m",difficulty:"medium"},
    {id:"k13",question:"A projectile has same range for angles θ and:",options:["90°-θ","180°-θ","θ/2","2θ"],correctIndex:0,explanation:"Complementary angles give same range: θ and 90°-θ",difficulty:"easy"},
    {id:"k14",question:"Rain falls vertically at 10 m/s. A man walks at 10 m/s. He should hold umbrella at what angle to vertical?",options:["45°","30°","60°","90°"],correctIndex:0,explanation:"tan θ = v_man/v_rain = 10/10 = 1, θ = 45°",difficulty:"medium"},
    {id:"k15",question:"Time of flight of a projectile on a horizontal plane is:",options:["2u sinθ/g","u sinθ/g","2u cosθ/g","u²sin2θ/g"],correctIndex:0,explanation:"T = 2u sinθ/g from vertical motion equations",difficulty:"easy"}
  ],
  "laws_of_motion": [
    {id:"lm1",question:"A 5 kg block on a frictionless surface is pushed by 10 N force. Acceleration?",options:["2 m/s²","5 m/s²","10 m/s²","0.5 m/s²"],correctIndex:0,explanation:"F=ma → a = F/m = 10/5 = 2 m/s²",difficulty:"easy"},
    {id:"lm2",question:"A body of mass 2 kg is acted upon by two forces 3N and 4N perpendicular to each other. Acceleration?",options:["2.5 m/s²","3.5 m/s²","5 m/s²","7 m/s²"],correctIndex:0,explanation:"F_net = √(9+16) = 5N, a = 5/2 = 2.5 m/s²",difficulty:"medium"},
    {id:"lm3",question:"Newton's third law states that action and reaction:",options:["Act on different bodies","Act on same body","Are unequal","Are in same direction"],correctIndex:0,explanation:"Action-reaction pairs always act on different bodies",difficulty:"easy"},
    {id:"lm4",question:"A lift accelerates upward at 2 m/s². Apparent weight of a 60 kg person? (g=10)",options:["720 N","600 N","480 N","840 N"],correctIndex:0,explanation:"W = m(g+a) = 60×12 = 720 N",difficulty:"medium"},
    {id:"lm5",question:"Coefficient of static friction between block and surface is 0.4. Min force to move 10 kg block? (g=10)",options:["40 N","10 N","100 N","4 N"],correctIndex:0,explanation:"f = μmg = 0.4×10×10 = 40 N",difficulty:"easy"},
    {id:"lm6",question:"A 2 kg body on a rough incline (30°, μ=0.2) slides down. Net acceleration?",options:["3.27 m/s²","5 m/s²","1 m/s²","6.7 m/s²"],correctIndex:0,explanation:"a = g(sinθ - μcosθ) = 10(0.5 - 0.2×0.866) = 3.27",difficulty:"hard"},
    {id:"lm7",question:"In a tug of war, the team that wins exerts more force on:",options:["The ground","The rope","The air","The other team"],correctIndex:0,explanation:"The winning team pushes harder against the ground (friction)",difficulty:"easy"},
    {id:"lm8",question:"Two blocks 2kg and 3kg connected by string, pulled by 10N on frictionless surface. Tension in string?",options:["4 N","6 N","10 N","2 N"],correctIndex:0,explanation:"a = F/(m1+m2) = 10/5 = 2, T = m1×a = 2×2 = 4 N",difficulty:"medium"},
    {id:"lm9",question:"A force of 50 N acts on a body for 0.1 s. Impulse is:",options:["5 N·s","50 N·s","0.5 N·s","500 N·s"],correctIndex:0,explanation:"Impulse = F×t = 50×0.1 = 5 N·s",difficulty:"easy"},
    {id:"lm10",question:"A rocket works on the principle of:",options:["Conservation of momentum","Conservation of energy","Newton's first law","Bernoulli's principle"],correctIndex:0,explanation:"Rocket propels by ejecting mass backward (momentum conservation)",difficulty:"easy"},
    {id:"lm11",question:"A horse pulls a cart. The cart moves because:",options:["Force on cart by horse > friction on cart","Horse's force > cart's reaction","Action > reaction","None"],correctIndex:0,explanation:"Cart moves when net force on it (horse pull - friction) > 0",difficulty:"medium"},
    {id:"lm12",question:"Banking of roads is done to provide:",options:["Centripetal force","Centrifugal force","Gravitational force","Friction"],correctIndex:0,explanation:"Banking provides component of normal force as centripetal force",difficulty:"medium"},
    {id:"lm13",question:"Mass of a body is 10 kg. What is its weight on moon? (g_moon = g/6)",options:["16.3 N","100 N","10 N","60 N"],correctIndex:0,explanation:"W = mg/6 = 10×10/6 ≈ 16.3 N",difficulty:"easy"},
    {id:"lm14",question:"A body of mass m is placed on a weighing machine in a freely falling lift. Reading?",options:["Zero","mg","2mg","mg/2"],correctIndex:0,explanation:"In free fall, effective g = 0, so apparent weight = 0",difficulty:"medium"},
    {id:"lm15",question:"Friction force is independent of:",options:["Area of contact","Normal force","Nature of surface","Roughness"],correctIndex:0,explanation:"Friction depends on normal force and μ, not contact area",difficulty:"easy"}
  ],
  "work_energy_power": [
    {id:"we1",question:"Work done by a force of 10 N moving an object 5 m in direction of force:",options:["50 J","15 J","2 J","100 J"],correctIndex:0,explanation:"W = F×d = 10×5 = 50 J",difficulty:"easy"},
    {id:"we2",question:"A body of mass 2 kg moving at 10 m/s. Its kinetic energy is:",options:["100 J","20 J","200 J","50 J"],correctIndex:0,explanation:"KE = ½mv² = ½×2×100 = 100 J",difficulty:"easy"},
    {id:"we3",question:"A spring with k=200 N/m compressed by 0.1 m. PE stored?",options:["1 J","2 J","10 J","0.1 J"],correctIndex:0,explanation:"PE = ½kx² = ½×200×0.01 = 1 J",difficulty:"easy"},
    {id:"we4",question:"Power of an engine that lifts 100 kg to 10 m in 5 s? (g=10)",options:["2000 W","1000 W","500 W","5000 W"],correctIndex:0,explanation:"P = mgh/t = 100×10×10/5 = 2000 W",difficulty:"medium"},
    {id:"we5",question:"If KE of a body is doubled, its momentum becomes:",options:["√2 times","2 times","4 times","Same"],correctIndex:0,explanation:"KE = p²/2m, if KE→2KE, p→√2 p",difficulty:"medium"},
    {id:"we6",question:"Work done by gravity on a body moving horizontally is:",options:["Zero","mgh","mg","Negative"],correctIndex:0,explanation:"W = Fd cosθ, θ=90° for horizontal motion, cos90°=0",difficulty:"easy"},
    {id:"we7",question:"A ball falls from height 10 m. Speed just before hitting ground? (g=10)",options:["√200 m/s","10 m/s","20 m/s","100 m/s"],correctIndex:0,explanation:"v = √(2gh) = √(2×10×10) = √200 m/s ≈ 14.14 m/s",difficulty:"easy"},
    {id:"we8",question:"The work-energy theorem states:",options:["Net work = change in KE","Work = Force × time","PE + KE = constant","Power = work/distance"],correctIndex:0,explanation:"W_net = ΔKE = KE_final - KE_initial",difficulty:"easy"},
    {id:"we9",question:"An engine of power 10 kW pulls a train at 36 km/h. Tractive force?",options:["1000 N","360 N","100 N","10000 N"],correctIndex:0,explanation:"P = Fv, F = P/v = 10000/10 = 1000 N (36 km/h = 10 m/s)",difficulty:"medium"},
    {id:"we10",question:"A body falls freely from rest through a height h. KE at h/2 is:",options:["mgh/2","mgh","mgh/4","2mgh"],correctIndex:0,explanation:"KE at h/2 = mg(h/2) = mgh/2 by energy conservation",difficulty:"medium"},
    {id:"we11",question:"Elastic collision conserves:",options:["Both KE and momentum","Only momentum","Only KE","Neither"],correctIndex:0,explanation:"Elastic collisions conserve both kinetic energy and momentum",difficulty:"easy"},
    {id:"we12",question:"1 horsepower equals approximately:",options:["746 W","500 W","1000 W","100 W"],correctIndex:0,explanation:"1 HP = 746 watts",difficulty:"easy"},
    {id:"we13",question:"Work done by friction is always:",options:["Negative","Positive","Zero","Depends on direction"],correctIndex:0,explanation:"Friction opposes motion, so angle is 180°, W = Fd cos180° < 0",difficulty:"easy"},
    {id:"we14",question:"A pump lifts 200 kg water to 20 m in 10 s. Power? (g=10)",options:["4000 W","2000 W","400 W","40000 W"],correctIndex:0,explanation:"P = mgh/t = 200×10×20/10 = 4000 W",difficulty:"medium"},
    {id:"we15",question:"Two bodies with same KE, masses m and 4m. Ratio of momenta?",options:["1:2","1:4","2:1","1:1"],correctIndex:0,explanation:"p = √(2mKE), ratio = √(m):√(4m) = 1:2",difficulty:"hard"}
  ],
  "electrostatics": [
    {id:"es1",question:"Force between two charges of 1 μC each separated by 1 m in vacuum?",options:["9×10⁻³ N","9×10³ N","9 N","9×10⁻⁶ N"],correctIndex:0,explanation:"F = kq₁q₂/r² = 9×10⁹×10⁻¹²/1 = 9×10⁻³ N",difficulty:"easy"},
    {id:"es2",question:"Electric field due to point charge q at distance r is:",options:["kq/r²","kq/r","kq²/r","kqr"],correctIndex:0,explanation:"E = kq/r² from Coulomb's law",difficulty:"easy"},
    {id:"es3",question:"Two charges +q and -q separated by d. Field at midpoint?",options:["4kq/d² toward -q","Zero","2kq/d²","kq/d²"],correctIndex:0,explanation:"Both fields point toward -q and add: 2×kq/(d/2)² = 8kq/d²... Actually 4kq/d²",difficulty:"medium"},
    {id:"es4",question:"Gauss's law relates electric flux through closed surface to:",options:["Enclosed charge","Total charge","External charge","Surface area"],correctIndex:0,explanation:"Φ = q_enclosed/ε₀ (Gauss's law)",difficulty:"easy"},
    {id:"es5",question:"Electric potential at a point is defined as:",options:["Work done per unit charge","Force per unit charge","Energy per unit volume","Charge per unit area"],correctIndex:0,explanation:"V = W/q, work done to bring unit charge from infinity",difficulty:"easy"},
    {id:"es6",question:"Capacitance of parallel plate capacitor with area A, separation d:",options:["ε₀A/d","ε₀d/A","A/ε₀d","ε₀Ad"],correctIndex:0,explanation:"C = ε₀A/d for parallel plate capacitor",difficulty:"easy"},
    {id:"es7",question:"Energy stored in capacitor of 10 μF charged to 100V:",options:["0.05 J","0.5 J","5 J","50 J"],correctIndex:0,explanation:"E = ½CV² = ½×10⁻⁵×10⁴ = 0.05 J",difficulty:"medium"},
    {id:"es8",question:"Electric field inside a conductor in electrostatic equilibrium is:",options:["Zero","Maximum","Minimum","Infinite"],correctIndex:0,explanation:"In equilibrium, E=0 inside conductor; charges reside on surface",difficulty:"easy"},
    {id:"es9",question:"If a dielectric of constant K is inserted in a capacitor, capacitance becomes:",options:["KC","C/K","K²C","C"],correctIndex:0,explanation:"C' = KC, dielectric increases capacitance by factor K",difficulty:"easy"},
    {id:"es10",question:"Equipotential surfaces are always:",options:["Perpendicular to field lines","Parallel to field lines","At 45° to field lines","Random"],correctIndex:0,explanation:"No work done moving charge on equipotential → must be ⊥ to E",difficulty:"medium"},
    {id:"es11",question:"Coulomb's law is analogous to:",options:["Newton's law of gravitation","Ohm's law","Faraday's law","Lenz's law"],correctIndex:0,explanation:"Both are inverse square laws: F ∝ 1/r²",difficulty:"easy"},
    {id:"es12",question:"Three capacitors 2μF each in series. Equivalent capacitance?",options:["2/3 μF","6 μF","2 μF","3 μF"],correctIndex:0,explanation:"1/C = 1/2+1/2+1/2 = 3/2, C = 2/3 μF",difficulty:"medium"},
    {id:"es13",question:"Electric flux through a closed surface enclosing charge Q is:",options:["Q/ε₀","Qε₀","Q/4πε₀","4πQ/ε₀"],correctIndex:0,explanation:"By Gauss's law, Φ = Q/ε₀",difficulty:"easy"},
    {id:"es14",question:"Potential at center of a uniformly charged ring of radius R and charge Q:",options:["kQ/R","kQ/R²","0","kQ/(R√2)"],correctIndex:0,explanation:"All points on ring are at distance R from center, V = kQ/R",difficulty:"medium"},
    {id:"es15",question:"Work done in moving charge along an equipotential surface is:",options:["Zero","Positive","Negative","Maximum"],correctIndex:0,explanation:"No potential difference → no work done: W = qΔV = 0",difficulty:"easy"}
  ],
  "organic_chemistry": [
    {id:"oc1",question:"The IUPAC name of CH₃-CH=CH₂ is:",options:["Propene","Propane","Propyne","Ethene"],correctIndex:0,explanation:"3-carbon chain with double bond = propene",difficulty:"easy"},
    {id:"oc2",question:"Which reagent converts an alkene to an alcohol?",options:["H₂O/H⁺","NaOH","HCl","NaCl"],correctIndex:0,explanation:"Acid-catalyzed hydration adds H₂O across double bond",difficulty:"easy"},
    {id:"oc3",question:"Markovnikov's rule applies to addition of HX to:",options:["Unsymmetrical alkenes","Symmetrical alkenes","Alkanes","Alkynes only"],correctIndex:0,explanation:"H adds to carbon with more H atoms in unsymmetrical alkenes",difficulty:"medium"},
    {id:"oc4",question:"Number of sigma bonds in ethylene (C₂H₄):",options:["5","4","6","3"],correctIndex:0,explanation:"4 C-H sigma + 1 C-C sigma = 5 sigma bonds",difficulty:"easy"},
    {id:"oc5",question:"Which is an electrophilic addition reaction?",options:["HBr + CH₂=CH₂","CH₄ + Cl₂","CH₃OH + Na","C₂H₆ → C₂H₄"],correctIndex:0,explanation:"HBr adds across the double bond via electrophilic mechanism",difficulty:"medium"},
    {id:"oc6",question:"Benzene undergoes primarily:",options:["Substitution reactions","Addition reactions","Elimination","Oxidation"],correctIndex:0,explanation:"Benzene's aromaticity makes substitution preferred over addition",difficulty:"easy"},
    {id:"oc7",question:"The hybridization of carbon in methane is:",options:["sp³","sp²","sp","sp³d"],correctIndex:0,explanation:"4 sigma bonds → sp³ hybridization → tetrahedral",difficulty:"easy"},
    {id:"oc8",question:"Which functional group is present in carboxylic acids?",options:["-COOH","-OH","-CHO","-CO-"],correctIndex:0,explanation:"Carboxylic acids have the -COOH functional group",difficulty:"easy"},
    {id:"oc9",question:"Toluene is:",options:["Methylbenzene","Ethylbenzene","Dimethylbenzene","Chlorobenzene"],correctIndex:0,explanation:"Toluene = C₆H₅CH₃ = methylbenzene",difficulty:"easy"},
    {id:"oc10",question:"SN1 reaction rate depends on:",options:["Substrate concentration only","Nucleophile only","Both","Neither"],correctIndex:0,explanation:"SN1 is unimolecular: rate = k[substrate]",difficulty:"medium"},
    {id:"oc11",question:"Which alcohol gives fastest Lucas test?",options:["Tertiary","Primary","Secondary","Methanol"],correctIndex:0,explanation:"Tertiary alcohols react immediately (stable carbocation)",difficulty:"medium"},
    {id:"oc12",question:"Grignard reagent has the formula:",options:["RMgX","RNa","RLi","RZnX"],correctIndex:0,explanation:"Grignard reagent = alkyl/aryl magnesium halide (RMgX)",difficulty:"easy"},
    {id:"oc13",question:"Dehydration of ethanol gives:",options:["Ethene","Methane","Ethanal","Ethane"],correctIndex:0,explanation:"C₂H₅OH → C₂H₄ + H₂O (dehydration/elimination)",difficulty:"easy"},
    {id:"oc14",question:"Wurtz reaction is used to prepare:",options:["Higher alkanes","Alkenes","Alcohols","Ethers"],correctIndex:0,explanation:"2RX + 2Na → R-R + 2NaX (higher alkane)",difficulty:"medium"},
    {id:"oc15",question:"The isomerism shown by CH₃OCH₃ and C₂H₅OH is:",options:["Functional group isomerism","Chain isomerism","Position isomerism","Tautomerism"],correctIndex:0,explanation:"Same formula C₂H₆O but different functional groups (ether vs alcohol)",difficulty:"medium"}
  ],
  "chemical_bonding": [
    {id:"cb1",question:"The bond angle in water molecule is approximately:",options:["104.5°","109.5°","120°","180°"],correctIndex:0,explanation:"Two lone pairs compress bond angle from 109.5° to 104.5°",difficulty:"easy"},
    {id:"cb2",question:"Which has the highest bond energy?",options:["N≡N","O=O","F-F","Cl-Cl"],correctIndex:0,explanation:"Triple bond in N₂ (945 kJ/mol) is strongest",difficulty:"medium"},
    {id:"cb3",question:"Hybridization in BF₃ is:",options:["sp²","sp³","sp","sp³d"],correctIndex:0,explanation:"3 bond pairs, no lone pairs → sp² → trigonal planar",difficulty:"easy"},
    {id:"cb4",question:"Ionic bond is formed between:",options:["Metal and non-metal","Two metals","Two non-metals","Noble gases"],correctIndex:0,explanation:"Metals lose e⁻, non-metals gain e⁻ → ionic bond",difficulty:"easy"},
    {id:"cb5",question:"Hydrogen bonding is strongest in:",options:["HF","HCl","HBr","HI"],correctIndex:0,explanation:"F is most electronegative → strongest H-bond in HF",difficulty:"easy"},
    {id:"cb6",question:"Shape of SF₆ is:",options:["Octahedral","Tetrahedral","Trigonal bipyramidal","Square planar"],correctIndex:0,explanation:"6 bond pairs → sp³d² → octahedral geometry",difficulty:"medium"},
    {id:"cb7",question:"Sigma bond is formed by:",options:["Head-on overlap","Lateral overlap","No overlap","π overlap"],correctIndex:0,explanation:"Sigma bonds form by head-on (axial) overlap of orbitals",difficulty:"easy"},
    {id:"cb8",question:"Which molecule has zero dipole moment?",options:["CO₂","H₂O","NH₃","HCl"],correctIndex:0,explanation:"CO₂ is linear and symmetric → dipoles cancel → μ=0",difficulty:"easy"},
    {id:"cb9",question:"Bond order of O₂ according to MOT is:",options:["2","1","3","1.5"],correctIndex:0,explanation:"Bond order = (bonding - antibonding)/2 = (10-6)/2 = 2",difficulty:"medium"},
    {id:"cb10",question:"VSEPR theory predicts molecular:",options:["Shape/geometry","Color","Reactivity","Melting point"],correctIndex:0,explanation:"VSEPR predicts geometry based on electron pair repulsion",difficulty:"easy"},
    {id:"cb11",question:"Which has a coordinate/dative bond?",options:["NH₄⁺","NaCl","H₂","Cl₂"],correctIndex:0,explanation:"NH₃ donates lone pair to H⁺ forming coordinate bond in NH₄⁺",difficulty:"medium"},
    {id:"cb12",question:"Metallic bonding is characterized by:",options:["Sea of delocalized electrons","Shared electron pairs","Transfer of electrons","Van der Waals forces"],correctIndex:0,explanation:"Metal cations in a 'sea' of delocalized electrons",difficulty:"easy"},
    {id:"cb13",question:"London dispersion forces are present in:",options:["All molecules","Only polar molecules","Only ionic compounds","Only metals"],correctIndex:0,explanation:"London forces exist in all molecules (temporary dipoles)",difficulty:"easy"},
    {id:"cb14",question:"The shape of XeF₄ is:",options:["Square planar","Tetrahedral","Octahedral","See-saw"],correctIndex:0,explanation:"4 bond pairs + 2 lone pairs → sp³d² → square planar",difficulty:"hard"},
    {id:"cb15",question:"Resonance structures have same:",options:["Arrangement of atoms","Arrangement of electrons","Bond lengths","All of these"],correctIndex:0,explanation:"Resonance structures differ only in electron distribution",difficulty:"medium"}
  ],
  "calculus": [
    {id:"ca1",question:"d/dx(x³) = ?",options:["3x²","x²","3x","x³"],correctIndex:0,explanation:"Power rule: d/dx(xⁿ) = nxⁿ⁻¹ = 3x²",difficulty:"easy"},
    {id:"ca2",question:"∫x² dx = ?",options:["x³/3 + C","x³ + C","2x + C","x²/2 + C"],correctIndex:0,explanation:"∫xⁿ dx = xⁿ⁺¹/(n+1) + C = x³/3 + C",difficulty:"easy"},
    {id:"ca3",question:"d/dx(sin x) = ?",options:["cos x","-cos x","sin x","-sin x"],correctIndex:0,explanation:"Derivative of sin x is cos x",difficulty:"easy"},
    {id:"ca4",question:"lim(x→0) sin(x)/x = ?",options:["1","0","∞","Does not exist"],correctIndex:0,explanation:"Standard limit: lim(x→0) sinx/x = 1",difficulty:"easy"},
    {id:"ca5",question:"∫₀^π sin(x) dx = ?",options:["2","0","π","1"],correctIndex:0,explanation:"[-cos x]₀^π = -cos π + cos 0 = 1+1 = 2",difficulty:"medium"},
    {id:"ca6",question:"d/dx(eˣ) = ?",options:["eˣ","xeˣ⁻¹","eˣ/x","ln x"],correctIndex:0,explanation:"Exponential function is its own derivative",difficulty:"easy"},
    {id:"ca7",question:"d/dx(ln x) = ?",options:["1/x","ln x","x","eˣ"],correctIndex:0,explanation:"Derivative of natural log is 1/x",difficulty:"easy"},
    {id:"ca8",question:"If f(x) = x² + 3x, then f'(2) = ?",options:["7","4","10","3"],correctIndex:0,explanation:"f'(x) = 2x+3, f'(2) = 4+3 = 7",difficulty:"easy"},
    {id:"ca9",question:"∫ 1/x dx = ?",options:["ln|x| + C","x⁻¹ + C","1/x² + C","-1/x + C"],correctIndex:0,explanation:"∫1/x dx = ln|x| + C",difficulty:"easy"},
    {id:"ca10",question:"Chain rule: d/dx[f(g(x))] = ?",options:["f'(g(x))·g'(x)","f'(x)·g'(x)","f(g'(x))","f'(g(x))"],correctIndex:0,explanation:"Chain rule: derivative of outer × derivative of inner",difficulty:"medium"},
    {id:"ca11",question:"d/dx(tan x) = ?",options:["sec²x","cosec²x","cos x","-sin x"],correctIndex:0,explanation:"Derivative of tan x = sec²x",difficulty:"easy"},
    {id:"ca12",question:"∫ eˣ dx = ?",options:["eˣ + C","xeˣ + C","eˣ/x + C","ln(eˣ) + C"],correctIndex:0,explanation:"∫eˣ dx = eˣ + C",difficulty:"easy"},
    {id:"ca13",question:"The maxima of f(x) = -x² + 4x occurs at x = ?",options:["2","4","0","-2"],correctIndex:0,explanation:"f'(x) = -2x+4 = 0 → x=2, f''(2)=-2<0 → maximum",difficulty:"medium"},
    {id:"ca14",question:"∫₀^1 3x² dx = ?",options:["1","3","1/3","0"],correctIndex:0,explanation:"[x³]₀^1 = 1-0 = 1",difficulty:"easy"},
    {id:"ca15",question:"d/dx(x·eˣ) using product rule = ?",options:["eˣ(1+x)","xeˣ","eˣ","x+eˣ"],correctIndex:0,explanation:"Product rule: eˣ·1 + x·eˣ = eˣ(1+x)",difficulty:"medium"}
  ],
  "probability": [
    {id:"pr1",question:"Probability of getting head in a fair coin toss:",options:["1/2","1","0","1/4"],correctIndex:0,explanation:"Fair coin: P(H) = 1/2",difficulty:"easy"},
    {id:"pr2",question:"Two dice thrown. P(sum = 7)?",options:["1/6","1/12","1/36","7/36"],correctIndex:0,explanation:"6 favorable outcomes out of 36: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1)",difficulty:"medium"},
    {id:"pr3",question:"If P(A)=0.3, P(B)=0.4, P(A∩B)=0.1, then P(A∪B)=?",options:["0.6","0.7","0.8","0.1"],correctIndex:0,explanation:"P(A∪B) = P(A)+P(B)-P(A∩B) = 0.3+0.4-0.1 = 0.6",difficulty:"easy"},
    {id:"pr4",question:"In how many ways can 5 books be arranged on a shelf?",options:["120","25","5","60"],correctIndex:0,explanation:"5! = 120 permutations",difficulty:"easy"},
    {id:"pr5",question:"C(10,3) = ?",options:["120","30","1000","720"],correctIndex:0,explanation:"10!/(3!×7!) = (10×9×8)/(3×2×1) = 120",difficulty:"medium"},
    {id:"pr6",question:"For mutually exclusive events, P(A∩B) = ?",options:["0","P(A)×P(B)","P(A)+P(B)","1"],correctIndex:0,explanation:"Mutually exclusive events cannot occur together: P(A∩B) = 0",difficulty:"easy"},
    {id:"pr7",question:"Bayes' theorem is used to find:",options:["Posterior probability","Sample space","Mean","Variance"],correctIndex:0,explanation:"Bayes' theorem calculates posterior probability given prior and evidence",difficulty:"medium"},
    {id:"pr8",question:"Expected value of a fair die throw:",options:["3.5","3","4","6"],correctIndex:0,explanation:"E(X) = (1+2+3+4+5+6)/6 = 21/6 = 3.5",difficulty:"easy"},
    {id:"pr9",question:"Variance of binomial distribution B(n,p) is:",options:["npq","np","nq","np²"],correctIndex:0,explanation:"Var(X) = npq where q = 1-p",difficulty:"medium"},
    {id:"pr10",question:"A card drawn from deck. P(King)?",options:["1/13","4/13","1/52","1/4"],correctIndex:0,explanation:"4 kings in 52 cards: P = 4/52 = 1/13",difficulty:"easy"},
    {id:"pr11",question:"If A and B are independent, P(A∩B) = ?",options:["P(A)·P(B)","P(A)+P(B)","0","P(A|B)"],correctIndex:0,explanation:"Independence: P(A∩B) = P(A)×P(B)",difficulty:"easy"},
    {id:"pr12",question:"Number of ways to choose committee of 3 from 8 people:",options:["56","24","336","8"],correctIndex:0,explanation:"C(8,3) = 8!/(3!5!) = 56",difficulty:"medium"},
    {id:"pr13",question:"P(A') if P(A) = 0.7:",options:["0.3","0.7","1","0"],correctIndex:0,explanation:"P(A') = 1 - P(A) = 1 - 0.7 = 0.3",difficulty:"easy"},
    {id:"pr14",question:"Mean of Poisson distribution with λ=5:",options:["5","25","√5","10"],correctIndex:0,explanation:"For Poisson, Mean = λ = 5",difficulty:"easy"},
    {id:"pr15",question:"Conditional probability P(A|B) = ?",options:["P(A∩B)/P(B)","P(A)/P(B)","P(B|A)","P(A∪B)/P(B)"],correctIndex:0,explanation:"P(A|B) = P(A∩B)/P(B) by definition",difficulty:"medium"}
  ]
};

// Topic metadata for resource links
const TopicMetadata = {
  "kinematics": {subject:"physics",displayName:"Kinematics",resourceLinks:["https://ncert.nic.in/textbook.php?keph1=3-3","https://en.wikipedia.org/wiki/Kinematics"]},
  "laws_of_motion": {subject:"physics",displayName:"Laws of Motion",resourceLinks:["https://ncert.nic.in/textbook.php?keph1=5-5","https://en.wikipedia.org/wiki/Newton%27s_laws_of_motion"]},
  "work_energy_power": {subject:"physics",displayName:"Work, Energy & Power",resourceLinks:["https://ncert.nic.in/textbook.php?keph1=6-6","https://en.wikipedia.org/wiki/Work_(physics)"]},
  "electrostatics": {subject:"physics",displayName:"Electrostatics",resourceLinks:["https://ncert.nic.in/textbook.php?leph1=1-1","https://en.wikipedia.org/wiki/Electrostatics"]},
  "organic_chemistry": {subject:"chemistry",displayName:"Organic Chemistry",resourceLinks:["https://ncert.nic.in/textbook.php?lech1=12-12","https://en.wikipedia.org/wiki/Organic_chemistry"]},
  "chemical_bonding": {subject:"chemistry",displayName:"Chemical Bonding",resourceLinks:["https://ncert.nic.in/textbook.php?kech1=4-4","https://en.wikipedia.org/wiki/Chemical_bond"]},
  "calculus": {subject:"math",displayName:"Calculus (Derivatives & Integrals)",resourceLinks:["https://ncert.nic.in/textbook.php?lemh1=5-5","https://en.wikipedia.org/wiki/Calculus"]},
  "probability": {subject:"math",displayName:"Probability & Combinatorics",resourceLinks:["https://ncert.nic.in/textbook.php?lemh1=13-13","https://en.wikipedia.org/wiki/Probability"]}
};

// ─── VECTOR DATABASE ────────────────────────────────
const VectorDB = {
  VOCAB_SIZE: 128,
  _vocab: null,
  _index: null,

  // Build vocabulary from all question texts
  _buildVocab() {
    const stopwords = new Set(["the","a","an","is","are","was","were","of","in","to","for","and","or","on","at","by","it","its","with","from","that","this","be","as","not","no","has","have","had","do","does","did","will","would","can","could","shall","should","may","might","which","what","who","whom","how","where","when","if","but","so","than","then","too","also","into","about","up","out","all","each","every","both","few","more","most","very"]);
    const wordFreq = {};
    for (const topic in QuestionBank) {
      QuestionBank[topic].forEach(q => {
        const tokens = (q.question + " " + q.options.join(" ") + " " + (q.explanation||"")).toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
        tokens.forEach(w => { wordFreq[w] = (wordFreq[w]||0) + 1; });
      });
    }
    // Also tokenize topic names
    for (const topic in QuestionBank) {
      topic.split("_").forEach(w => { wordFreq[w] = (wordFreq[w]||0) + 5; }); // boost topic words
    }
    // Take top VOCAB_SIZE words by frequency
    const sorted = Object.entries(wordFreq).sort((a,b) => b[1]-a[1]).slice(0, this.VOCAB_SIZE);
    this._vocab = {};
    sorted.forEach(([word], i) => { this._vocab[word] = i; });
    return this._vocab;
  },

  embedText(text) {
    if (!this._vocab) this._buildVocab();
    const vec = new Float32Array(this.VOCAB_SIZE);
    const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(w => w.length > 2);
    const totalDocs = Object.values(QuestionBank).reduce((s,arr) => s+arr.length, 0);
    tokens.forEach(w => {
      if (this._vocab.hasOwnProperty(w)) {
        vec[this._vocab[w]] += 1;
      }
    });
    // Normalize (L2)
    let mag = 0;
    for (let i = 0; i < vec.length; i++) mag += vec[i]*vec[i];
    mag = Math.sqrt(mag);
    if (mag > 0) for (let i = 0; i < vec.length; i++) vec[i] /= mag;
    return vec;
  },

  cosine(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]*b[i];
      magA += a[i]*a[i];
      magB += b[i]*b[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    return (magA && magB) ? dot/(magA*magB) : 0;
  },

  buildIndex() {
    if (!this._vocab) this._buildVocab();
    this._index = [];
    for (const topic in QuestionBank) {
      QuestionBank[topic].forEach(q => {
        const vec = this.embedText(q.question + " " + topic.replace(/_/g," "));
        this._index.push({
          id: q.id,
          topic: topic,
          vector: Array.from(vec),
          difficulty: q.difficulty
        });
      });
    }
    try {
      qbWriteShared("vectorIndex", this._index);
    } catch(e) {
      console.warn("[VectorDB] Could not persist index:", e);
    }
    console.log("[VectorDB] Index built:", this._index.length, "entries");
    return this._index;
  },

  getIndex() {
    if (this._index) return this._index;
    try {
      const stored = qbReadShared("vectorIndex", null);
      if (stored) {
        this._index = stored;
        console.log("[VectorDB] Index loaded from cache:", this._index.length, "entries");
        return this._index;
      }
    } catch(e) {}
    return this.buildIndex();
  },

  getQuestionsForTopic(topic, count) {
    count = count || 5;
    // Exact match first
    if (QuestionBank[topic] && QuestionBank[topic].length > 0) {
      console.log("[VectorDB] Exact match for topic:", topic, "->", QuestionBank[topic].length, "questions");
      const shuffled = [...QuestionBank[topic]].sort(() => Math.random()-0.5);
      return shuffled.slice(0, count);
    }
    // Fallback: vector similarity
    console.warn("[VectorDB] No exact match for topic:", topic, "- using vector fallback");
    const index = this.getIndex();
    const queryVec = this.embedText(topic.replace(/_/g," "));
    const scored = index.map(entry => ({
      ...entry,
      score: this.cosine(queryVec, new Float32Array(entry.vector))
    })).sort((a,b) => b.score-a.score);
    const topIds = scored.slice(0, count).map(e => e.id);
    const results = [];
    for (const t in QuestionBank) {
      QuestionBank[t].forEach(q => {
        if (topIds.includes(q.id)) results.push(q);
      });
    }
    return results;
  },

  getSimilarQuestions(questionId, topK) {
    topK = topK || 3;
    const index = this.getIndex();
    const target = index.find(e => e.id === questionId);
    if (!target) return [];
    const targetVec = new Float32Array(target.vector);
    const scored = index
      .filter(e => e.id !== questionId)
      .map(e => ({...e, score: this.cosine(targetVec, new Float32Array(e.vector))}))
      .sort((a,b) => b.score-a.score)
      .slice(0, topK);
    const ids = scored.map(e => e.id);
    const results = [];
    for (const t in QuestionBank) {
      QuestionBank[t].forEach(q => {
        if (ids.includes(q.id)) results.push(q);
      });
    }
    return results;
  }
};

// ─── LEARNING QUIZ MANAGER ──────────────────────────
const LearningQuizManager = {
  getQuizQuestions(topic, count) {
    count = count || 5;
    console.log("ACTIVE TOPIC:", topic);
    console.log("QUESTION COUNT:", QuestionBank[topic]?.length);

    if (!QuestionBank[topic]) {
      console.error("Topic mismatch: no questions for", topic);
    }

    // Get base questions via vector DB
    let questions = VectorDB.getQuestionsForTopic(topic, count + 2);

    // Check for previous wrong answers to inject review questions
    const progress = qbReadShared("learningQuizProgress", {});
    const wrongIds = (progress[topic] && progress[topic].wrongIds) || [];

    if (wrongIds.length > 0) {
      // Get 1-2 similar questions based on wrong answers
      const reviewQs = [];
      for (let i = 0; i < Math.min(2, wrongIds.length); i++) {
        const similar = VectorDB.getSimilarQuestions(wrongIds[i], 1);
        similar.forEach(q => {
          if (!reviewQs.find(r => r.id === q.id) && !questions.find(existing => existing.id === q.id)) {
            reviewQs.push(q);
          }
        });
      }
      // Inject review questions, remove extras to maintain count
      questions = [...reviewQs, ...questions].slice(0, count);
    } else {
      questions = questions.slice(0, count);
    }

    // Mix difficulties
    questions.sort(() => Math.random()-0.5);

    console.log("VECTOR INDEX SIZE:", VectorDB.getIndex().length);
    return questions;
  },

  validateNodeProgress(topic, score, totalQuestions, correctCount, wrongIds) {
    let plan = qbReadShared("learningPlan", null);
    let userState = qbReadShared("userState", null);
    if (!plan || !userState) {
      console.error("[Validate] No plan or state found");
      return { passed: false };
    }

    const scorePct = Math.round((correctCount / totalQuestions) * 100);
    console.log("QUIZ SCORE:", scorePct, "%");

    // Save quiz progress
    let progress = qbReadShared("learningQuizProgress", {});
    if (!progress[topic]) progress[topic] = { attempts: 0, bestScore: 0, wrongIds: [] };
    progress[topic].attempts++;
    progress[topic].bestScore = Math.max(progress[topic].bestScore, scorePct);
    progress[topic].wrongIds = [...new Set([...(wrongIds||[]), ...progress[topic].wrongIds])].slice(0, 20);
    qbWriteShared("learningQuizProgress", progress);

    // Find active node
    const activeIdx = plan.nodes.findIndex(n => n.id === plan.currentNodeId);
    if (activeIdx === -1) {
      console.error("[Validate] No active node found");
      return { passed: false };
    }

    if (scorePct >= 70) {
      // PASS: mark completed, unlock next
      plan.nodes[activeIdx].status = "completed";
      
      if (activeIdx + 1 < plan.nodes.length) {
        plan.nodes[activeIdx + 1].status = "active";
        plan.currentNodeId = plan.nodes[activeIdx + 1].id;
      } else {
        plan.currentNodeId = plan.nodes[activeIdx].id; // all done
      }

      // Update user state
      userState.masteryLevel = Math.min(100, (userState.masteryLevel || 0) + 10);
      if (!userState.strongTopics.includes(topic)) userState.strongTopics.push(topic);
      userState.weakTopics = userState.weakTopics.filter(t => t !== topic);

      qbWriteShared("learningPlan", plan);
      qbWriteShared("userState", userState);
      console.log("UPDATED PLAN:", plan);
      return { passed: true, newNodeId: plan.currentNodeId };
    } else {
      // FAIL: keep active, increment failure count
      if (!userState.failureCount) userState.failureCount = {};
      userState.failureCount[topic] = (userState.failureCount[topic] || 0) + 1;

      if (!userState.weakTopics.includes(topic)) userState.weakTopics.push(topic);

      // If failed 3+ times, insert reinforcement node
      if (userState.failureCount[topic] >= 3) {
        const reinforcementExists = plan.nodes.some(n => n.type === "reinforcement" && n.topic === topic);
        if (!reinforcementExists) {
          const reinforcementNode = {
            id: "reinforce_" + topic + "_" + Date.now(),
            topic: topic,
            subject: plan.nodes[activeIdx].subject,
            resourceLinks: plan.nodes[activeIdx].resourceLinks,
            status: "locked",
            type: "reinforcement"
          };
          plan.nodes.splice(activeIdx + 1, 0, reinforcementNode);
          console.log("[Validate] Inserted reinforcement node for", topic);
        }
      }

      qbWriteShared("learningPlan", plan);
      qbWriteShared("userState", userState);
      console.log("UPDATED PLAN:", plan);
      return { passed: false, failureCount: userState.failureCount[topic] };
    }
  }
};

// Initialize vector index on load
if (typeof window !== 'undefined') {
  window.QuestionBank = QuestionBank;
  window.TopicMetadata = TopicMetadata;
  window.VectorDB = VectorDB;
  window.LearningQuizManager = LearningQuizManager;
  // Build index eagerly
  setTimeout(() => VectorDB.buildIndex(), 100);
}
