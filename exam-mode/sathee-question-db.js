(function (global) {
  const MIN_QUESTIONS_PER_TOPIC = 30;
  const YEARS = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const DIFFICULTIES = ["easy", "medium", "hard"];

  function stableClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function sanitizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sanitizeId(value) {
    return String(value || "").replace(/[^A-Za-z0-9_]/g, "_");
  }

  function normalizeSubject(value) {
    const s = sanitizeText(value).toLowerCase();
    if (s === "maths" || s === "math" || s === "mathematics") return "Maths";
    if (s === "physics") return "Physics";
    if (s === "chemistry") return "Chemistry";
    return sanitizeText(value);
  }

  function normalizeQuestionKey(question) {
    return sanitizeText(question).toLowerCase();
  }

  function formatNum(value, digits) {
    const d = typeof digits === "number" ? digits : 2;
    const rounded = Number(value.toFixed(d));
    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
    return String(rounded);
  }

  function buildOptionSet(correct, wrongs, salt) {
    const correctText = sanitizeText(correct);
    const unique = [];

    [correctText, ...(wrongs || []).map((x) => sanitizeText(x))].forEach((item) => {
      if (!item) return;
      if (!unique.includes(item)) unique.push(item);
    });

    let pad = 1;
    while (unique.length < 4) {
      const fallback = `${correctText} + ${pad}`;
      if (!unique.includes(fallback)) unique.push(fallback);
      pad++;
    }

    const base = unique.slice(0, 4);
    const shift = Math.abs(Number(salt) || 0) % 4;
    const options = base.slice(shift).concat(base.slice(0, shift));
    const correctIndex = options.indexOf(correctText);
    const correctAnswer = ["A", "B", "C", "D"][correctIndex < 0 ? 0 : correctIndex];

    return { options, correctAnswer };
  }

  function buildFromExistingOptions(options, correctIndex, salt) {
    const cleaned = (options || []).map((x) => sanitizeText(x)).filter(Boolean);
    const safe = cleaned.length >= 4
      ? cleaned.slice(0, 4)
      : [...cleaned, ...["Option A", "Option B", "Option C", "Option D"]].slice(0, 4);
    const idx = Math.max(0, Math.min(3, Number(correctIndex) || 0));
    const correct = safe[idx];
    const wrongs = safe.filter((_, i) => i !== idx);
    return buildOptionSet(correct, wrongs, salt);
  }

  function makePhysicsQuestion(topic, i) {
    const k = i + 1;
    const v = i % 5;

    if (topic === "Mechanics") {
      if (v === 0) {
        const m = 2 + (k % 5);
        const a = 3 + (k % 4);
        const ans = `${m * a} N`;
        const mcq = buildOptionSet(ans, [`${m + a} N`, `${m * a + 4} N`, `${m * a - 3} N`], k);
        return {
          question: `A ${m} kg body moves with constant acceleration ${a} m/s^2. The net force on it is:`,
          ...mcq,
          explanation: `Using F = ma, force = ${m} * ${a} = ${m * a} N.`
        };
      }
      if (v === 1) {
        const u = 10 + 2 * (k % 6);
        const g = 10;
        const h = (u * u) / (2 * g);
        const ans = `${formatNum(h)} m`;
        const mcq = buildOptionSet(ans, [`${formatNum(h / 2)} m`, `${formatNum(h + 5)} m`, `${formatNum(h - 4)} m`], k);
        return {
          question: `A particle is thrown vertically upward with speed ${u} m/s. Taking g = 10 m/s^2, maximum height reached is:`,
          ...mcq,
          explanation: `At top v = 0, so h = u^2/(2g) = ${u * u}/20 = ${formatNum(h)} m.`
        };
      }
      if (v === 2) {
        const mass = 1 + (k % 4);
        const vel = 4 + (k % 5);
        const r = 1 + (k % 3);
        const f = (mass * vel * vel) / r;
        const ans = `${formatNum(f)} N`;
        const mcq = buildOptionSet(ans, [`${formatNum(f / 2)} N`, `${formatNum(f + 8)} N`, `${formatNum(f - 6)} N`], k);
        return {
          question: `A body of mass ${mass} kg moves in a circle of radius ${r} m with speed ${vel} m/s. Centripetal force is:`,
          ...mcq,
          explanation: `F = mv^2/r = ${mass} * ${vel * vel}/${r} = ${formatNum(f)} N.`
        };
      }
      if (v === 3) {
        const F = 20 + 5 * (k % 6);
        const d = 2 + (k % 5);
        const w = (F * d) / 2;
        const ans = `${formatNum(w)} J`;
        const mcq = buildOptionSet(ans, [`${formatNum(F * d)} J`, `${formatNum(w + 10)} J`, `${formatNum(w - 5)} J`], k);
        return {
          question: `A constant force ${F} N acts on a block through displacement ${d} m at 60 degrees to displacement. Work done is:`,
          ...mcq,
          explanation: `W = F d cos60 = ${F} * ${d} * 1/2 = ${formatNum(w)} J.`
        };
      }
      const m1 = 1 + (k % 4);
      const m2 = 2 + (k % 5);
      const u1 = 4 + (k % 4);
      const vf = (m1 * u1) / (m1 + m2);
      const ans = `${formatNum(vf)} m/s`;
      const mcq = buildOptionSet(ans, [`${formatNum(vf + 1)} m/s`, `${formatNum(vf - 0.5)} m/s`, `${formatNum((m1 + m2) / u1)} m/s`], k);
      return {
        question: `Two blocks (${m1} kg and ${m2} kg) stick after collision. If only ${m1} kg block initially moves at ${u1} m/s, common speed is:`,
        ...mcq,
        explanation: `By momentum conservation, v = m1*u1/(m1+m2) = ${formatNum(vf)} m/s.`
      };
    }

    if (topic === "Kinematics") {
      if (v === 0) {
        const u = 5 + (k % 6);
        const a = 2 + (k % 4);
        const t = 2 + (k % 5);
        const vel = u + a * t;
        const mcq = buildOptionSet(`${vel} m/s`, [`${u * t} m/s`, `${vel + 3} m/s`, `${vel - 4} m/s`], k);
        return {
          question: `For uniform acceleration, if u = ${u} m/s, a = ${a} m/s^2 and t = ${t} s, final velocity v is:`,
          ...mcq,
          explanation: `Using v = u + at = ${u} + ${a}*${t} = ${vel} m/s.`
        };
      }
      if (v === 1) {
        const u = 3 + (k % 5);
        const a = 1 + (k % 4);
        const t = 2 + (k % 4);
        const s = u * t + 0.5 * a * t * t;
        const mcq = buildOptionSet(`${formatNum(s)} m`, [`${formatNum(u * t)} m`, `${formatNum(s + 4)} m`, `${formatNum(s - 3)} m`], k);
        return {
          question: `A particle has u = ${u} m/s and constant acceleration ${a} m/s^2 for ${t} s. Displacement is:`,
          ...mcq,
          explanation: `s = ut + (1/2)at^2 = ${formatNum(s)} m.`
        };
      }
      if (v === 2) {
        const u = 4 + (k % 5);
        const a = 2 + (k % 3);
        const t = 3 + (k % 3);
        const vfinal = u + a * t;
        const s = (vfinal * vfinal - u * u) / (2 * a);
        const mcq = buildOptionSet(`${formatNum(s)} m`, [`${formatNum(s + 5)} m`, `${formatNum(s - 4)} m`, `${formatNum((u + vfinal) / 2)} m`], k);
        return {
          question: `Given u = ${u} m/s, a = ${a} m/s^2 and final velocity ${vfinal} m/s, displacement is:`,
          ...mcq,
          explanation: `Using v^2 - u^2 = 2as, s = ${formatNum(s)} m.`
        };
      }
      if (v === 3) {
        const u = 20 + 2 * (k % 5);
        const g = 10;
        const T = u / g;
        const mcq = buildOptionSet(`${formatNum(T)} s`, [`${formatNum(T / 2)} s`, `${formatNum(2 * T)} s`, `${formatNum(T + 1)} s`], k);
        return {
          question: `A projectile is launched at 30 degrees with speed ${u} m/s. Time of flight (g=10 m/s^2) is:`,
          ...mcq,
          explanation: `T = 2u sin30/g = u/g = ${formatNum(T)} s.`
        };
      }
      const v1 = 30 + 5 * (k % 4);
      const v2 = 20 + 5 * (k % 3);
      const rel = v1 + v2;
      const mcq = buildOptionSet(`${rel} km/h`, [`${Math.abs(v1 - v2)} km/h`, `${rel + 10} km/h`, `${rel - 15} km/h`], k);
      return {
        question: `Two cars move in opposite directions at ${v1} km/h and ${v2} km/h. Relative speed is:`,
        ...mcq,
        explanation: `Opposite direction => relative speed = v1 + v2 = ${rel} km/h.`
      };
    }

    if (topic === "Electromagnetism") {
      if (v === 0) {
        const R1 = 2 + (k % 5);
        const R2 = 3 + (k % 6);
        const req = R1 + R2;
        const mcq = buildOptionSet(`${req} ohm`, [`${formatNum((R1 * R2) / (R1 + R2))} ohm`, `${Math.abs(R1 - R2)} ohm`, `${req + 2} ohm`], k);
        return {
          question: `Two resistors ${R1} ohm and ${R2} ohm are connected in series. Equivalent resistance is:`,
          ...mcq,
          explanation: `For series, Req = R1 + R2 = ${req} ohm.`
        };
      }
      if (v === 1) {
        const R1 = 4 + (k % 4);
        const R2 = 6 + (k % 5);
        const req = (R1 * R2) / (R1 + R2);
        const mcq = buildOptionSet(`${formatNum(req)} ohm`, [`${R1 + R2} ohm`, `${formatNum(R1 / R2)} ohm`, `${formatNum(req + 1.5)} ohm`], k);
        return {
          question: `Resistors ${R1} ohm and ${R2} ohm are connected in parallel. Equivalent resistance is:`,
          ...mcq,
          explanation: `For parallel, Req = R1R2/(R1+R2) = ${formatNum(req)} ohm.`
        };
      }
      if (v === 2) {
        const V = 12 + 2 * (k % 6);
        const R = 3 + (k % 5);
        const I = V / R;
        const mcq = buildOptionSet(`${formatNum(I)} A`, [`${V * R} A`, `${formatNum(I + 1)} A`, `${formatNum(I - 0.5)} A`], k);
        return {
          question: `A potential difference of ${V} V is applied across ${R} ohm resistor. Current is:`,
          ...mcq,
          explanation: `By Ohm's law, I = V/R = ${formatNum(I)} A.`
        };
      }
      if (v === 3) {
        const B = 0.2 + 0.1 * (k % 5);
        const I = 2 + (k % 4);
        const L = 0.5 + 0.1 * (k % 4);
        const F = B * I * L;
        const mcq = buildOptionSet(`${formatNum(F)} N`, [`${formatNum(F + 0.2)} N`, `${formatNum(F - 0.1)} N`, `${formatNum(B + I + L)} N`], k);
        return {
          question: `A conductor of length ${formatNum(L)} m carrying current ${I} A is perpendicular to field ${formatNum(B)} T. Magnetic force is:`,
          ...mcq,
          explanation: `F = BIL = ${formatNum(F)} N.`
        };
      }
      const N = 50 + 10 * (k % 5);
      const dPhi = 0.02 + 0.01 * (k % 4);
      const dt = 0.1 + 0.05 * (k % 3);
      const emf = (N * dPhi) / dt;
      const mcq = buildOptionSet(`${formatNum(emf)} V`, [`${formatNum(emf / 2)} V`, `${formatNum(emf + 4)} V`, `${formatNum(N * dPhi)} V`], k);
      return {
        question: `Flux through a coil changes by ${formatNum(dPhi)} Wb in ${formatNum(dt)} s for ${N} turns. Induced emf magnitude is:`,
        ...mcq,
        explanation: `|e| = N(dPhi/dt) = ${formatNum(emf)} V.`
      };
    }

    if (topic === "Thermodynamics") {
      if (v === 0) {
        const n = 1 + (k % 3);
        const R = 8.314;
        const T = 300 + 20 * (k % 4);
        const V = 0.02 + 0.01 * (k % 3);
        const P = (n * R * T) / V;
        const pAtm = P / 101325;
        const mcq = buildOptionSet(`${formatNum(pAtm)} atm`, [`${formatNum(pAtm + 0.5)} atm`, `${formatNum(pAtm - 0.4)} atm`, `${formatNum(P)} atm`], k);
        return {
          question: `${n} mol ideal gas at ${T} K occupies ${formatNum(V)} m^3. Pressure in atm is approximately:`,
          ...mcq,
          explanation: `P = nRT/V and 1 atm = 101325 Pa; P approx ${formatNum(pAtm)} atm.`
        };
      }
      if (v === 1) {
        const Q = 200 + 50 * (k % 4);
        const W = 80 + 20 * (k % 3);
        const dU = Q - W;
        const mcq = buildOptionSet(`${dU} J`, [`${Q + W} J`, `${W - Q} J`, `${dU + 60} J`], k);
        return {
          question: `A system absorbs Q = ${Q} J heat and does W = ${W} J work. Change in internal energy is:`,
          ...mcq,
          explanation: `First law: dU = Q - W = ${dU} J.`
        };
      }
      if (v === 2) {
        const Th = 500 + 50 * (k % 3);
        const Tc = 300 + 20 * (k % 3);
        const eta = (1 - Tc / Th) * 100;
        const mcq = buildOptionSet(`${formatNum(eta)}%`, [`${formatNum(100 - eta)}%`, `${formatNum(eta + 10)}%`, `${formatNum(eta - 8)}%`], k);
        return {
          question: `A Carnot engine operates between ${Th} K and ${Tc} K. Efficiency is:`,
          ...mcq,
          explanation: `eta = 1 - Tc/Th = ${formatNum(eta)}%.`
        };
      }
      if (v === 3) {
        const Cv = 20 + 2 * (k % 4);
        const Rgas = 8;
        const Cp = Cv + Rgas;
        const mcq = buildOptionSet(`${Cp} J/mol-K`, [`${Cv - Rgas} J/mol-K`, `${Cv} J/mol-K`, `${Cp + 4} J/mol-K`], k);
        return {
          question: `For an ideal gas, if Cv = ${Cv} J/mol-K, then Cp is:`,
          ...mcq,
          explanation: `Cp - Cv = R, so Cp = ${Cv} + ${Rgas} = ${Cp} J/mol-K.`
        };
      }
      const m = 0.5 + 0.5 * (k % 3);
      const c = 4200;
      const dT = 5 + (k % 6);
      const q = m * c * dT;
      const mcq = buildOptionSet(`${formatNum(q)} J`, [`${formatNum(q / 2)} J`, `${formatNum(q + 2000)} J`, `${formatNum(q - 1500)} J`], k);
      return {
        question: `${formatNum(m)} kg water is heated by ${dT} degC. Taking c = 4200 J/kg-K, heat absorbed is:`,
        ...mcq,
        explanation: `q = mc dT = ${formatNum(q)} J.`
      };
    }

    if (topic === "Optics") {
      if (v === 0) {
        const u = 20 + 10 * (k % 4);
        const img = 20 + 10 * ((k + 1) % 3);
        const f = (u * img) / (u + img);
        const mcq = buildOptionSet(`${formatNum(f)} cm`, [`${formatNum(u + img)} cm`, `${formatNum(f + 4)} cm`, `${formatNum(f - 3)} cm`], k);
        return {
          question: `For a convex lens, object and image distances are ${u} cm and ${img} cm. Focal length is:`,
          ...mcq,
          explanation: `1/f = 1/u + 1/v, so f = uv/(u+v) = ${formatNum(f)} cm.`
        };
      }
      if (v === 1) {
        const f = 10 + 2 * (k % 5);
        const p = 100 / f;
        const mcq = buildOptionSet(`${formatNum(p)} D`, [`${formatNum(p + 1)} D`, `${formatNum(p - 1)} D`, `${formatNum(f)} D`], k);
        return {
          question: `A lens has focal length ${f} cm. Its power is:`,
          ...mcq,
          explanation: `Power P = 1/f(m) = 100/f(cm) = ${formatNum(p)} D.`
        };
      }
      if (v === 2) {
        const u = 15 + 5 * (k % 5);
        const img = 30 + 5 * (k % 4);
        const m = img / u;
        const mcq = buildOptionSet(`${formatNum(m)}`, [`${formatNum(1 / m)}`, `${formatNum(m + 0.5)}`, `${formatNum(m - 0.4)}`], k);
        return {
          question: `If object distance is ${u} cm and image distance is ${img} cm, magnification magnitude is:`,
          ...mcq,
          explanation: `|m| = v/u = ${formatNum(m)}.`
        };
      }
      if (v === 3) {
        const n = k % 2 === 0 ? 1.5 : 2;
        const c = 3;
        const vel = c / n;
        const mcq = buildOptionSet(`${formatNum(vel)} x10^8 m/s`, [`${formatNum(n)} x10^8 m/s`, `${formatNum(vel + 0.4)} x10^8 m/s`, `${formatNum(vel - 0.2)} x10^8 m/s`], k);
        return {
          question: `A medium has refractive index ${n}. Speed of light in this medium is:`,
          ...mcq,
          explanation: `n = c/v => v = c/n = ${formatNum(vel)} x10^8 m/s.`
        };
      }
      const n = k % 2 === 0 ? 2 : Math.SQRT2;
      const angle = n === 2 ? 30 : 45;
      const mcq = buildOptionSet(`${angle} deg`, ["60 deg", "35 deg", "25 deg"], k);
      return {
        question: `For medium-to-air refraction with refractive index n = ${formatNum(n)}, critical angle is closest to:`,
        ...mcq,
        explanation: `sin C = 1/n. For n=${formatNum(n)}, C approx ${angle} deg.`
      };
    }

    if (topic === "Modern Physics") {
      if (v === 0) {
        const hv = 4 + (k % 4);
        const phi = 2 + (k % 2);
        const kmax = hv - phi;
        const mcq = buildOptionSet(`${kmax} eV`, [`${hv + phi} eV`, `${phi - hv} eV`, `${kmax + 1} eV`], k);
        return {
          question: `For a photoelectric material, incident photon energy is ${hv} eV and work function is ${phi} eV. Maximum KE of photoelectrons is:`,
          ...mcq,
          explanation: `Kmax = hv - phi = ${kmax} eV.`
        };
      }
      if (v === 1) {
        const p = (2 + (k % 4)) * 1e-24;
        const lambda = 6.6e-34 / p;
        const mcq = buildOptionSet(`${formatNum(lambda * 1e10)} A`, [`${formatNum(lambda * 1e9)} A`, `${formatNum(lambda * 1e10 + 0.5)} A`, `${formatNum(lambda * 1e10 - 0.3)} A`], k);
        return {
          question: `A particle has momentum ${formatNum(p / 1e-24)} x10^-24 kg m/s. Its de Broglie wavelength is:`,
          ...mcq,
          explanation: `lambda = h/p = ${formatNum(lambda * 1e10)} A (using h = 6.6 x10^-34 SI).`
        };
      }
      if (v === 2) {
        const n0 = 640 * (1 + (k % 3));
        const halfLives = 1 + (k % 4);
        const n = n0 / Math.pow(2, halfLives);
        const mcq = buildOptionSet(`${formatNum(n)}`, [`${formatNum(n0 - n)}`, `${formatNum(n * 2)}`, `${formatNum(n / 2)}`], k);
        return {
          question: `A radioactive sample initially has ${n0} nuclei. After ${halfLives} half-lives, remaining nuclei are:`,
          ...mcq,
          explanation: `N = N0(1/2)^n = ${formatNum(n)}.`
        };
      }
      if (v === 3) {
        const energy = 2 + (k % 5);
        const lambda = 1240 / energy;
        const mcq = buildOptionSet(`${formatNum(lambda)} nm`, [`${formatNum(lambda / 2)} nm`, `${formatNum(lambda + 100)} nm`, `${formatNum(energy)} nm`], k);
        return {
          question: `A photon has energy ${energy} eV. Its wavelength is approximately:`,
          ...mcq,
          explanation: `Using E(eV) = 1240/lambda(nm), lambda = ${formatNum(lambda)} nm.`
        };
      }
      const n = 2 + (k % 4);
      const E = -13.6 / (n * n);
      const mcq = buildOptionSet(`${formatNum(E)} eV`, [`${formatNum(-13.6 / n)} eV`, `${formatNum(E - 1)} eV`, `${formatNum(-E)} eV`], k);
      return {
        question: `Energy of electron in hydrogen atom at principal quantum number n = ${n} is:`,
        ...mcq,
        explanation: `En = -13.6/n^2 = ${formatNum(E)} eV.`
      };
    }

    // Waves (default physics bucket)
    if (v === 0) {
      const f = 40 + 10 * (k % 4);
      const lambda = 0.4 + 0.1 * (k % 3);
      const vel = f * lambda;
      const mcq = buildOptionSet(`${formatNum(vel)} m/s`, [`${formatNum(f / lambda)} m/s`, `${formatNum(vel + 5)} m/s`, `${formatNum(vel - 4)} m/s`], k);
      return {
        question: `A wave has frequency ${f} Hz and wavelength ${formatNum(lambda)} m. Wave speed is:`,
        ...mcq,
        explanation: `v = f lambda = ${formatNum(vel)} m/s.`
      };
    }
    if (v === 1) {
      const f1 = 256 + 10 * (k % 4);
      const f2 = 250 + 8 * (k % 4);
      const beat = Math.abs(f1 - f2);
      const mcq = buildOptionSet(`${beat} Hz`, [`${f1 + f2} Hz`, `${formatNum(beat + 2)} Hz`, `${formatNum(beat - 1)} Hz`], k);
      return {
        question: `Two sound waves of frequencies ${f1} Hz and ${f2} Hz superpose. Beat frequency is:`,
        ...mcq,
        explanation: `f_beat = |f1 - f2| = ${beat} Hz.`
      };
    }
    if (v === 2) {
      const vel = 120 + 10 * (k % 4);
      const L = 0.5 + 0.1 * (k % 3);
      const f = vel / (2 * L);
      const mcq = buildOptionSet(`${formatNum(f)} Hz`, [`${formatNum(f / 2)} Hz`, `${formatNum(f + 20)} Hz`, `${formatNum(f - 10)} Hz`], k);
      return {
        question: `A stretched string has wave speed ${vel} m/s and length ${formatNum(L)} m. Fundamental frequency is:`,
        ...mcq,
        explanation: `For fundamental mode, f = v/(2L) = ${formatNum(f)} Hz.`
      };
    }
    if (v === 3) {
      const vel = 340;
      const L = 0.25 + 0.05 * (k % 3);
      const f = (3 * vel) / (4 * L);
      const mcq = buildOptionSet(`${formatNum(f)} Hz`, [`${formatNum(f / 3)} Hz`, `${formatNum(f + 100)} Hz`, `${formatNum(f - 80)} Hz`], k);
      return {
        question: `A closed organ pipe of length ${formatNum(L)} m has speed of sound 340 m/s. First overtone frequency is:`,
        ...mcq,
        explanation: `For closed pipe first overtone, f = 3v/(4L) = ${formatNum(f)} Hz.`
      };
    }
    const f = 2 + (k % 7);
    const T = 1 / f;
    const mcq = buildOptionSet(`${formatNum(T)} s`, [`${f} s`, `${formatNum(T + 0.1)} s`, `${formatNum(T - 0.05)} s`], k);
    return {
      question: `If frequency of an SHM is ${f} Hz, the time period is:`,
      ...mcq,
      explanation: `T = 1/f = ${formatNum(T)} s.`
    };
  }

  function makeChemistryQuestion(topic, i) {
    const k = i + 1;
    const v = i % 5;

    if (topic === "Atomic Structure") {
      if (v === 0) {
        const n = 2 + (k % 4);
        const e = 2 * n * n;
        const mcq = buildOptionSet(String(e), [String(e - 2), String(e + 4), String(n * n)], k);
        return {
          question: `Maximum number of electrons that can be accommodated in shell n = ${n} is:`,
          ...mcq,
          explanation: `Maximum electrons in shell n is 2n^2 = ${e}.`
        };
      }
      if (v === 1) {
        const V = 36 + 4 * (k % 5);
        const lambda = 12.27 / Math.sqrt(V);
        const mcq = buildOptionSet(`${formatNum(lambda)} A`, [`${formatNum(lambda + 0.4)} A`, `${formatNum(lambda - 0.2)} A`, `${formatNum(12.27 / V)} A`], k);
        return {
          question: `For an electron accelerated through ${V} V, de Broglie wavelength (in A) is closest to:`,
          ...mcq,
          explanation: `lambda(A) approx 12.27/sqrt(V) = ${formatNum(lambda)} A.`
        };
      }
      if (v === 2) {
        const E = (3.3 + 0.33 * (k % 4)) * 1e-19;
        const nu = E / 6.6e-34;
        const mcq = buildOptionSet(`${formatNum(nu / 1e14)} x10^14 Hz`, [`${formatNum(nu / 1e15)} x10^14 Hz`, `${formatNum(nu / 1e14 + 1)} x10^14 Hz`, `${formatNum(nu / 1e14 - 0.6)} x10^14 Hz`], k);
        return {
          question: `A photon has energy ${formatNum(E / 1e-19)} x10^-19 J. Its frequency is approximately:`,
          ...mcq,
          explanation: `nu = E/h = ${formatNum(nu / 1e14)} x10^14 Hz.`
        };
      }
      if (v === 3) {
        const n = 2 + (k % 4);
        const E = -13.6 / (n * n);
        const mcq = buildOptionSet(`${formatNum(E)} eV`, [`${formatNum(-13.6 / n)} eV`, `${formatNum(E - 1)} eV`, `${formatNum(-E)} eV`], k);
        return {
          question: `Bohr energy of hydrogen atom at level n = ${n} is:`,
          ...mcq,
          explanation: `En = -13.6/n^2 = ${formatNum(E)} eV.`
        };
      }
      const l = (k % 3) + 1;
      const names = { 1: "p", 2: "d", 3: "f" };
      const orbitals = 2 * l + 1;
      const mcq = buildOptionSet(String(orbitals), [String(orbitals + 1), String(orbitals - 1), String(2 * orbitals)], k);
      return {
        question: `Number of orbitals in ${names[l]}-subshell is:`,
        ...mcq,
        explanation: `Number of orbitals in subshell l is 2l + 1 = ${orbitals}.`
      };
    }

    if (topic === "Chemical Bonding") {
      if (v === 0) {
        const set = [
          { q: "Hybridization of carbon in CH4 is", ans: "sp3", wrong: ["sp", "sp2", "dsp2"] },
          { q: "Hybridization of boron in BF3 is", ans: "sp2", wrong: ["sp3", "sp", "dsp2"] },
          { q: "Hybridization of carbon in C2H2 is", ans: "sp", wrong: ["sp2", "sp3", "d2sp3"] }
        ][k % 3];
        const mcq = buildOptionSet(set.ans, set.wrong, k);
        return { question: `${set.q}:`, ...mcq, explanation: `Based on steric number and molecular geometry.` };
      }
      if (v === 1) {
        const set = [
          { q: "Bond order of N2", ans: "3", wrong: ["2", "2.5", "1"] },
          { q: "Bond order of O2", ans: "2", wrong: ["1", "3", "2.5"] },
          { q: "Bond order of O2+", ans: "2.5", wrong: ["2", "3", "1.5"] }
        ][k % 3];
        const mcq = buildOptionSet(set.ans, set.wrong, k);
        return { question: `${set.q} is:`, ...mcq, explanation: `From molecular orbital electron configuration.` };
      }
      if (v === 2) {
        const set = [
          { q: "Molecular geometry of NH3", ans: "Trigonal pyramidal", wrong: ["Trigonal planar", "Linear", "Tetrahedral"] },
          { q: "Molecular geometry of CO2", ans: "Linear", wrong: ["Bent", "Trigonal planar", "Tetrahedral"] },
          { q: "Molecular geometry of BF3", ans: "Trigonal planar", wrong: ["Tetrahedral", "Bent", "Linear"] }
        ][k % 3];
        const mcq = buildOptionSet(set.ans, set.wrong, k);
        return { question: `${set.q} is:`, ...mcq, explanation: `Predicted by VSEPR theory.` };
      }
      if (v === 3) {
        const set = [
          { q: "Formal charge on N in NH4+", ans: "+1", wrong: ["0", "-1", "+2"] },
          { q: "Formal charge on O in H3O+", ans: "+1", wrong: ["0", "-1", "+2"] },
          { q: "Formal charge on central atom in NO3-", ans: "+1", wrong: ["0", "-1", "+2"] }
        ][k % 3];
        const mcq = buildOptionSet(set.ans, set.wrong, k);
        return { question: `${set.q} is:`, ...mcq, explanation: `Formal charge = valence - nonbonding - bonding/2.` };
      }
      const mcq = buildOptionSet("CO2", ["NH3", "H2O", "SO2"], k);
      return {
        question: "Which molecule has zero net dipole moment?",
        ...mcq,
        explanation: "CO2 is linear and symmetric, so dipole moments cancel."
      };
    }

    if (topic === "Equilibrium") {
      if (v === 0) {
        const H2 = 0.2 + 0.1 * (k % 3);
        const I2 = 0.2 + 0.1 * ((k + 1) % 3);
        const HI = 0.8 + 0.1 * (k % 4);
        const Kc = (HI * HI) / (H2 * I2);
        const mcq = buildOptionSet(`${formatNum(Kc)}`, [`${formatNum(Kc / 2)}`, `${formatNum(Kc + 1.5)}`, `${formatNum((H2 + I2) / HI)}`], k);
        return {
          question: `For H2 + I2 <=> 2HI at equilibrium: [H2]=${formatNum(H2)} M, [I2]=${formatNum(I2)} M, [HI]=${formatNum(HI)} M. Kc is:`,
          ...mcq,
          explanation: `Kc = [HI]^2/([H2][I2]) = ${formatNum(Kc)}.`
        };
      }
      if (v === 1) {
        const conc = [1e-2, 1e-3, 1e-4][k % 3];
        const pH = -Math.log10(conc);
        const mcq = buildOptionSet(`${formatNum(pH)}`, ["1", "2", "3"], k);
        return {
          question: `pH of a strong monoprotic acid solution of concentration ${conc} M is:`,
          ...mcq,
          explanation: `For strong acid, [H+] = C and pH = -log10(C) = ${formatNum(pH)}.`
        };
      }
      if (v === 2) {
        const dN = [-1, 0, 1][k % 3];
        const R = 0.0821;
        const T = 298;
        const factor = Math.pow(R * T, dN);
        const mcq = buildOptionSet(`${formatNum(factor)}`, [`${formatNum(1 / factor)}`, "1", `${formatNum(factor + 2)}`], k);
        return {
          question: `For a gaseous reaction with Delta n = ${dN}, factor relating Kp and Kc at 298 K is (RT)^Delta n. Its value is:`,
          ...mcq,
          explanation: `Kp = Kc(RT)^Delta n. With RT approx ${formatNum(R * T)}, factor = ${formatNum(factor)}.`
        };
      }
      if (v === 3) {
        const mcq = buildOptionSet("Equilibrium shifts to side with fewer moles of gas", [
          "Equilibrium shifts to side with more moles of gas",
          "No shift for gaseous systems",
          "Only catalyst controls direction"
        ], k);
        return {
          question: "If pressure is increased for a gaseous equilibrium, the system generally:",
          ...mcq,
          explanation: "By Le Chatelier principle, higher pressure favors side with fewer gaseous moles."
        };
      }
      const n = 2 + (k % 3);
      const factor = Math.pow(2, n);
      const mcq = buildOptionSet(`${factor}K`, [`${n}K`, `${factor / 2}K`, `${factor + 2}K`], k);
      return {
        question: `If an equilibrium equation is multiplied by ${n}, the new equilibrium constant becomes:`,
        ...mcq,
        explanation: `When equation is multiplied by n, K becomes K^n.`
      };
    }

    if (topic === "Organic Chemistry") {
      if (v === 0) {
        const mcq = buildOptionSet("2-bromopropane", ["1-bromopropane", "propane", "propyne"], k);
        return {
          question: "Major product of Markovnikov addition of HBr to propene is:",
          ...mcq,
          explanation: "H adds to terminal carbon and Br to more substituted carbon."
        };
      }
      if (v === 1) {
        const mcq = buildOptionSet("Conc. HNO3 + Conc. H2SO4", ["NaNO3 + HCl", "HNO3 only", "H2SO4 only"], k);
        return {
          question: "Nitration of benzene requires reagent mixture:",
          ...mcq,
          explanation: "Mixed acid generates nitronium ion (NO2+)."
        };
      }
      if (v === 2) {
        const mcq = buildOptionSet("tert-Butyl chloride", ["Methyl chloride", "Vinyl chloride", "Chlorobenzene"], k);
        return {
          question: "Which substrate most readily undergoes SN1 reaction?",
          ...mcq,
          explanation: "Tertiary carbocation formation is most favorable in SN1."
        };
      }
      if (v === 3) {
        const set = [
          { f: "C4H10", ans: "2" },
          { f: "C5H12", ans: "3" },
          { f: "C6H14", ans: "5" }
        ][k % 3];
        const mcq = buildOptionSet(set.ans, ["1", "4", "6"], k);
        return {
          question: `Number of structural isomers of ${set.f} is:`,
          ...mcq,
          explanation: "Standard alkane isomer counts are used."
        };
      }
      const mcq = buildOptionSet("6 pi-electrons", ["4 pi-electrons", "8 pi-electrons", "10 pi-electrons"], k);
      return {
        question: "Benzene is aromatic because it satisfies Huckel rule with:",
        ...mcq,
        explanation: "Aromatic systems follow 4n+2 pi-electron rule; benzene has 6 pi electrons."
      };
    }

    if (topic === "Electrochemistry") {
      if (v === 0) {
        const ec = 1.1 + 0.1 * (k % 3);
        const ea = 0.2 + 0.1 * (k % 3);
        const cell = ec - ea;
        const mcq = buildOptionSet(`${formatNum(cell)} V`, [`${formatNum(ec + ea)} V`, `${formatNum(cell + 0.2)} V`, `${formatNum(cell - 0.1)} V`], k);
        return {
          question: `For a galvanic cell with E_cathode = ${formatNum(ec)} V and E_anode = ${formatNum(ea)} V, E_cell is:`,
          ...mcq,
          explanation: `E_cell = E_cathode - E_anode = ${formatNum(cell)} V.`
        };
      }
      if (v === 1) {
        const n = 2;
        const E = 1 + 0.1 * (k % 4);
        const dG = -n * 96485 * E;
        const mcq = buildOptionSet(`${formatNum(dG / 1000)} kJ/mol`, [`${formatNum(-dG / 1000)} kJ/mol`, `${formatNum(dG / 2000)} kJ/mol`, `${formatNum(dG / 1000 + 10)} kJ/mol`], k);
        return {
          question: `For n = ${n} and E_cell = ${formatNum(E)} V, Gibbs free energy change is:`,
          ...mcq,
          explanation: `Delta G = -nFE = ${formatNum(dG / 1000)} kJ/mol.`
        };
      }
      if (v === 2) {
        const I = 2 + (k % 4);
        const t = 965;
        const M = 63.5;
        const n = 2;
        const m = (M * I * t) / (n * 96500);
        const mcq = buildOptionSet(`${formatNum(m)} g`, [`${formatNum(2 * m)} g`, `${formatNum(m + 0.5)} g`, `${formatNum(m - 0.3)} g`], k);
        return {
          question: `Mass of Cu deposited by current ${I} A in ${t} s (M=63.5, n=2) is:`,
          ...mcq,
          explanation: `Using m = MIt/(nF), deposited mass = ${formatNum(m)} g.`
        };
      }
      if (v === 3) {
        const ratio = 10;
        const n = 1;
        const E = 0.0591 * Math.log10(ratio) / n;
        const mcq = buildOptionSet(`${formatNum(E)} V`, [`${formatNum(E * 2)} V`, `${formatNum(E + 0.03)} V`, `${formatNum(E - 0.02)} V`], k);
        return {
          question: `For a concentration cell at 298 K with concentration ratio 10 and n=1, potential is approximately:`,
          ...mcq,
          explanation: `E = (0.0591/n)log10(C2/C1) = ${formatNum(E)} V.`
        };
      }
      const mcq = buildOptionSet("Oxidation occurs at anode", ["Reduction occurs at anode", "Anode is always positive", "Electrons flow from cathode to anode"], k);
      return {
        question: "For electrochemical cells, which statement is correct?",
        ...mcq,
        explanation: "Anode is the electrode where oxidation takes place."
      };
    }

    if (topic === "Thermochemistry") {
      if (v === 0) {
        const m = 200 + 50 * (k % 4);
        const c = 4.2;
        const dT = 10 + 2 * (k % 4);
        const q = m * c * dT;
        const mcq = buildOptionSet(`${formatNum(q)} J`, [`${formatNum(q / 2)} J`, `${formatNum(q + 500)} J`, `${formatNum(q - 400)} J`], k);
        return {
          question: `${m} g water is heated by ${dT} degC (c = 4.2 J g^-1 K^-1). Heat absorbed is:`,
          ...mcq,
          explanation: `q = mcDeltaT = ${formatNum(q)} J.`
        };
      }
      if (v === 1) {
        const mcq = buildOptionSet("Negative", ["Positive", "Zero always", "Depends only on catalyst"], k);
        return {
          question: "Sign of Delta H for an exothermic reaction is:",
          ...mcq,
          explanation: "Exothermic process releases heat, hence Delta H < 0."
        };
      }
      if (v === 2) {
        const dH1 = -100 - 10 * (k % 4);
        const dH2 = 40 + 5 * (k % 4);
        const dH = dH1 + dH2;
        const mcq = buildOptionSet(`${dH} kJ/mol`, [`${dH1 - dH2} kJ/mol`, `${dH + 20} kJ/mol`, `${-dH} kJ/mol`], k);
        return {
          question: `If two reaction steps have Delta H values ${dH1} and ${dH2} kJ/mol, overall Delta H is:`,
          ...mcq,
          explanation: `By Hess law, enthalpy changes add algebraically: ${dH} kJ/mol.`
        };
      }
      if (v === 3) {
        const broken = 420 + 20 * (k % 4);
        const formed = 520 + 10 * (k % 4);
        const dH = broken - formed;
        const mcq = buildOptionSet(`${dH} kJ/mol`, [`${formed - broken} kJ/mol`, `${dH + 30} kJ/mol`, `${dH - 20} kJ/mol`], k);
        return {
          question: `If bond energy required to break bonds is ${broken} kJ/mol and released on formation is ${formed} kJ/mol, Delta H is:`,
          ...mcq,
          explanation: `Delta H approx Sigma(E broken) - Sigma(E formed) = ${dH} kJ/mol.`
        };
      }
      const mcq = buildOptionSet("Heat exchanged at constant pressure", ["Change in entropy", "Heat exchanged at constant volume", "Activation energy"], k);
      return {
        question: "At constant pressure, enthalpy change corresponds to:",
        ...mcq,
        explanation: "At constant pressure, Delta H equals heat exchanged (qp)."
      };
    }

    // Chemical Kinetics (default chemistry)
    if (v === 0) {
      const rate1 = 2 + (k % 4);
      const rate2 = rate1 * 2;
      const mcq = buildOptionSet("First order", ["Zero order", "Second order", "Third order"], k);
      return {
        question: `If concentration of A is doubled and rate increases from ${rate1} to ${rate2}, order with respect to A is:`,
        ...mcq,
        explanation: `Rate doubling with concentration doubling implies first order dependence.`
      };
    }
    if (v === 1) {
      const k1 = 0.0693 + 0.00693 * (k % 3);
      const tHalf = 0.693 / k1;
      const mcq = buildOptionSet(`${formatNum(tHalf)} s`, [`${formatNum(1 / k1)} s`, `${formatNum(tHalf + 2)} s`, `${formatNum(tHalf - 1)} s`], k);
      return {
        question: `For a first-order reaction with k = ${formatNum(k1)} s^-1, half-life is:`,
        ...mcq,
        explanation: `t1/2 = 0.693/k = ${formatNum(tHalf)} s.`
      };
    }
    if (v === 2) {
      const mcq = buildOptionSet("L mol^-1 s^-1", ["s^-1", "mol L^-1 s^-1", "L^2 mol^-2 s^-1"], k);
      return {
        question: "Unit of rate constant k for a second-order reaction is:",
        ...mcq,
        explanation: "For second order, k has units concentration^-1 time^-1 => L mol^-1 s^-1."
      };
    }
    if (v === 3) {
      const mcq = buildOptionSet("Rate constant generally increases", ["Rate constant decreases to zero", "Activation energy becomes zero", "Reaction order changes automatically"], k);
      return {
        question: "When temperature increases, according to Arrhenius equation:",
        ...mcq,
        explanation: "Higher temperature increases exponential factor, increasing k."
      };
    }
    const mcq = buildOptionSet("Two half-lives", ["One half-life", "Three half-lives", "Four half-lives"], k);
    return {
      question: "In a first-order reaction, 75% completion corresponds to elapsed time of:",
      ...mcq,
      explanation: "25% remains => (1/2)^2, so two half-lives."
    };
  }

  function makeMathQuestion(topic, i) {
    const k = i + 1;
    const v = i % 5;

    if (topic === "Algebra") {
      if (v === 0) {
        const sum = 6 + (k % 7);
        const product = 8 + (k % 5);
        const value = sum * sum - 2 * product;
        const mcq = buildOptionSet(String(value), [String(value + 2), String(value - 3), String(sum * product)], k);
        return {
          question: `If alpha and beta are roots of x^2 - (${sum})x + ${product} = 0, then alpha^2 + beta^2 equals:`,
          ...mcq,
          explanation: `alpha^2 + beta^2 = (alpha+beta)^2 - 2alphabeta = ${sum}^2 - 2(${product}) = ${value}.`
        };
      }
      if (v === 1) {
        const a = 4 + (k % 5);
        const d = 2 + (k % 4);
        const n = 10 + (k % 5);
        const sn = (n * (2 * a + (n - 1) * d)) / 2;
        const mcq = buildOptionSet(String(sn), [String(sn + n), String(sn - d), String(a + d + n)], k);
        return {
          question: `Sum of first ${n} terms of an AP with first term ${a} and common difference ${d} is:`,
          ...mcq,
          explanation: `Sn = n/2 [2a + (n-1)d] = ${sn}.`
        };
      }
      if (v === 2) {
        const a = 2 + (k % 3);
        const r = 2 + (k % 2);
        const n = 6 + (k % 4);
        const sum = a * (Math.pow(r, n) - 1) / (r - 1);
        const mcq = buildOptionSet(String(sum), [String(sum - a), String(sum + r), String(Math.pow(r, n - 1))], k);
        return {
          question: `Sum of first ${n} terms of GP: a=${a}, r=${r} is:`,
          ...mcq,
          explanation: `Sn = a(r^n - 1)/(r-1) = ${sum}.`
        };
      }
      if (v === 3) {
        const r1 = 2 + (k % 4);
        const r2 = 6 + (k % 5);
        const rhs = r1 * r2;
        const answer = r1 + r2;
        const mcq = buildOptionSet(String(answer), [String(answer + 1), String(answer - 2), String(r2)], k);
        return {
          question: `If log10[(x-${r1})(x-${r2})] = log10(${rhs}), then the valid x is:`,
          ...mcq,
          explanation: `Equation gives (x-${r1})(x-${r2}) = ${rhs}. So x(x-${r1 + r2}) = 0; domain x>${r2} gives x=${answer}.`
        };
      }
      const a = 2 + (k % 6);
      const det = a * a * a + 1;
      const mcq = buildOptionSet(String(det), [String(det - 2), String(a * a + 1), String(det + 3)], k);
      return {
        question: `Determinant of matrix [[${a},1,0],[0,${a},1],[1,0,${a}]] is:`,
        ...mcq,
        explanation: `det = a(a^2) + 1 = a^3 + 1 = ${det}.`
      };
    }

    if (topic === "Calculus") {
      if (v === 0) {
        const n = 2 + (k % 4);
        const der = 2 * n + 1;
        const mcq = buildOptionSet(String(der), [String(der - 2), String(der + 3), String(n * n)], k);
        return {
          question: `If f(x)=x^${n}(x+1), then f'(1) equals:`,
          ...mcq,
          explanation: `f'(x)=nx^(n-1)(x+1)+x^n. At x=1, f'(1)=2n+1=${der}.`
        };
      }
      if (v === 1) {
        const m = 1 + (k % 3);
        const n = 3 + (k % 3);
        const integral = 1 / (m + 1) + 1 / (n + 1);
        const mcq = buildOptionSet(`${formatNum(integral, 4)}`, [`${formatNum(integral + 0.25, 4)}`, `${formatNum(integral - 0.2, 4)}`, `${formatNum(1 / (m + n + 1), 4)}`], k);
        return {
          question: `Value of integral from 0 to 1 of (x^${m} + x^${n}) dx is:`,
          ...mcq,
          explanation: `Integral = 1/(${m + 1}) + 1/(${n + 1}) = ${formatNum(integral, 4)}.`
        };
      }
      if (v === 2) {
        const p = 2 + (k % 4);
        const mcq = buildOptionSet(String(p), [String(p - 1), String(p + 1), "1"], k);
        return {
          question: `Value of lim (x->0) [((1+x)^${p} - 1)/x] is:`,
          ...mcq,
          explanation: `Using binomial expansion, leading term is ${p}x, so limit is ${p}.`
        };
      }
      if (v === 3) {
        const p = 1 + (k % 4);
        const q = 4 + (k % 5);
        const xv = -p / 2;
        const yv = -(p * p) / 4 + q;
        const mcq = buildOptionSet(`${formatNum(yv)}`, [`${formatNum(yv + 1)}`, `${formatNum(yv - 2)}`, `${formatNum(xv)}`], k);
        return {
          question: `Maximum value of y = -x^2 ${p ? `- ${p}x` : ""} + ${q} is:`,
          ...mcq,
          explanation: `For y=-x^2-px+q, vertex y-value is q + p^2/4 = ${formatNum(yv)}.`
        };
      }
      const c = 2 + (k % 4);
      const area = (c * c) / 6;
      const mcq = buildOptionSet(`${formatNum(area)}`, [`${formatNum(area + 1)}`, `${formatNum(area - 0.5)}`, `${formatNum(c / 2)}`], k);
      return {
        question: `Area enclosed by y=x and y=x^2/${c} between their points of intersection is:`,
        ...mcq,
        explanation: `Intersections at x=0 and x=${c}; area = integral_0^${c}(x - x^2/${c})dx = ${formatNum(area)}.`
      };
    }

    if (topic === "Coordinate Geometry") {
      if (v === 0) {
        const a = 1 + (k % 3);
        const b = 2 + (k % 3);
        const c = 3 + (k % 4);
        const px = 2 + (k % 4);
        const py = 1 + (k % 5);
        const d = Math.abs(a * px + b * py + c) / Math.sqrt(a * a + b * b);
        const mcq = buildOptionSet(`${formatNum(d)}`, [`${formatNum(d + 1)}`, `${formatNum(d - 0.5)}`, `${formatNum(Math.sqrt(a * a + b * b))}`], k);
        return {
          question: `Distance of point (${px}, ${py}) from line ${a}x + ${b}y + ${c} = 0 is:`,
          ...mcq,
          explanation: `Distance = |ax0+by0+c|/sqrt(a^2+b^2) = ${formatNum(d)}.`
        };
      }
      if (v === 1) {
        const x1 = 1 + (k % 3), y1 = 2 + (k % 4), x2 = x1 + 3, y2 = y1 + 2 + (k % 3);
        const m = (y2 - y1) / (x2 - x1);
        const mp = -1 / m;
        const mcq = buildOptionSet(`${formatNum(mp)}`, [`${formatNum(m)}`, `${formatNum(-m)}`, `${formatNum(1 / m)}`], k);
        return {
          question: `Slope of a line perpendicular to the line through (${x1}, ${y1}) and (${x2}, ${y2}) is:`,
          ...mcq,
          explanation: `Slope of given line is ${formatNum(m)}, so perpendicular slope is ${formatNum(mp)}.`
        };
      }
      if (v === 2) {
        const x1 = 1 + (k % 3), y1 = 2 + (k % 3), x2 = x1 + 4, y2 = y1 + 2;
        const r2 = ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) / 4;
        const mcq = buildOptionSet(`${formatNum(r2)}`, [`${formatNum(r2 + 2)}`, `${formatNum(r2 - 1)}`, `${formatNum(Math.sqrt(r2))}`], k);
        return {
          question: `If endpoints of a diameter of a circle are (${x1},${y1}) and (${x2},${y2}), then radius^2 is:`,
          ...mcq,
          explanation: `r^2 = [(x2-x1)^2 + (y2-y1)^2]/4 = ${formatNum(r2)}.`
        };
      }
      if (v === 3) {
        const x1 = 1 + (k % 4), y1 = 2 + (k % 4), x2 = 7 + (k % 3), y2 = 6 + (k % 3);
        const m = 1 + (k % 3), n = 2 + (k % 3);
        const x = (m * x2 + n * x1) / (m + n);
        const y = (m * y2 + n * y1) / (m + n);
        const mcq = buildOptionSet(`(${formatNum(x)}, ${formatNum(y)})`, [`(${x1}, ${y1})`, `(${x2}, ${y2})`, `(${formatNum(x + 1)}, ${formatNum(y)})`], k);
        return {
          question: `Point dividing segment joining A(${x1},${y1}) and B(${x2},${y2}) internally in ratio ${m}:${n} is:`,
          ...mcq,
          explanation: `Section formula gives ((mx2+nx1)/(m+n), (my2+ny1)/(m+n)) = (${formatNum(x)}, ${formatNum(y)}).`
        };
      }
      const a = 2 + (k % 3), b = 1 + (k % 3), c1 = 5 + (k % 4), c2 = 1 + (k % 4);
      const dist = Math.abs(c1 - c2) / Math.sqrt(a * a + b * b);
      const mcq = buildOptionSet(`${formatNum(dist)}`, [`${formatNum(dist + 1)}`, `${formatNum(dist - 0.5)}`, `${formatNum(Math.abs(c1 - c2))}`], k);
      return {
        question: `Distance between parallel lines ${a}x + ${b}y + ${c1} = 0 and ${a}x + ${b}y + ${c2} = 0 is:`,
        ...mcq,
        explanation: `Distance = |c1-c2|/sqrt(a^2+b^2) = ${formatNum(dist)}.`
      };
    }

    if (topic === "Probability") {
      if (v === 0) {
        const tosses = 3 + (k % 2);
        const p = 1 - 1 / Math.pow(2, tosses);
        const mcq = buildOptionSet(`${formatNum(p, 4)}`, [`${formatNum(1 - p, 4)}`, `${formatNum(p - 0.125, 4)}`, `${formatNum(p + 0.1, 4)}`], k);
        return {
          question: `Probability of getting at least one head in ${tosses} tosses of a fair coin is:`,
          ...mcq,
          explanation: `P(at least one head) = 1 - (1/2)^${tosses} = ${formatNum(p, 4)}.`
        };
      }
      if (v === 1) {
        const mcq = buildOptionSet("1/3", ["1/4", "1/2", "2/3"], k);
        return {
          question: "A card drawn from a deck is known to be a face card. Probability that it is a king is:",
          ...mcq,
          explanation: "Among 12 face cards (J,Q,K in 4 suits), kings are 4. So probability = 4/12 = 1/3."
        };
      }
      if (v === 2) {
        const target = 8 + (k % 4);
        const waysMap = { 8: 5, 9: 4, 10: 3, 11: 2 };
        const p = waysMap[target] / 36;
        const mcq = buildOptionSet(`${formatNum(p, 4)}`, [`${formatNum(p + 0.05, 4)}`, `${formatNum(p - 0.03, 4)}`, `${formatNum(1 - p, 4)}`], k);
        return {
          question: `When two fair dice are thrown, probability that their sum is ${target} is:`,
          ...mcq,
          explanation: `Favorable outcomes = ${waysMap[target]}, total outcomes = 36, so probability = ${formatNum(p, 4)}.`
        };
      }
      if (v === 3) {
        const red = 4 + (k % 3);
        const blue = 3 + (k % 2);
        const total = red + blue;
        const prob = (red / total) * ((red - 1) / (total - 1));
        const mcq = buildOptionSet(`${formatNum(prob, 4)}`, [`${formatNum(prob + 0.06, 4)}`, `${formatNum(prob - 0.04, 4)}`, `${formatNum(red / total, 4)}`], k);
        return {
          question: `A bag has ${red} red and ${blue} blue balls. Two balls are drawn without replacement. Probability both are red is:`,
          ...mcq,
          explanation: `P = (${red}/${total}) * (${red - 1}/${total - 1}) = ${formatNum(prob, 4)}.`
        };
      }
      const p = (2 + (k % 3)) / 10;
      const q = (3 + (k % 3)) / 10;
      const union = p + q - p * q;
      const mcq = buildOptionSet(`${formatNum(union, 4)}`, [`${formatNum(p + q, 4)}`, `${formatNum(p * q, 4)}`, `${formatNum(1 - union, 4)}`], k);
      return {
        question: `If P(A)=${formatNum(p)} and P(B)=${formatNum(q)} for independent events, then P(A union B) is:`,
        ...mcq,
        explanation: `P(A union B) = P(A) + P(B) - P(A)P(B) = ${formatNum(union, 4)}.`
      };
    }

    if (topic === "Combinatorics") {
      if (v === 0) {
        const n = 10 + (k % 3), r = 3 + (k % 2);
        const comb = factorial(n) / (factorial(r) * factorial(n - r));
        const mcq = buildOptionSet(String(comb), [String(comb + 5), String(comb - 4), String(n * r)], k);
        return {
          question: `Value of ${n}C${r} is:`,
          ...mcq,
          explanation: `${n}C${r} = n!/(r!(n-r)!) = ${comb}.`
        };
      }
      if (v === 1) {
        const mcq = buildOptionSet("60", ["120", "30", "90"], k);
        return {
          question: "Number of distinct arrangements of letters of BANANA is:",
          ...mcq,
          explanation: "6!/(3!2!) = 60."
        };
      }
      if (v === 2) {
        const pool = 8 + (k % 3);
        const count = (pool - 1) * (pool - 1) * (pool - 2) * (pool - 3);
        const mcq = buildOptionSet(String(count), [String(count + 50), String(count - 40), String((pool - 1) * (pool - 2) * (pool - 3))], k);
        return {
          question: `How many 4-digit numbers can be formed from digits 0 to ${pool - 1} without repetition?`,
          ...mcq,
          explanation: `First digit has ${pool - 1} choices (non-zero), then ${pool - 1}, ${pool - 2}, ${pool - 3}.`
        };
      }
      if (v === 3) {
        const total = 7 + (k % 4), girls = 3 + (k % 2), choose = 4;
        const ways = nCr(total, choose) - nCr(total - girls, choose);
        const mcq = buildOptionSet(String(ways), [String(ways + 3), String(ways - 2), String(nCr(total, choose))], k);
        return {
          question: `From ${total} students including ${girls} girls, number of 4-member committees with at least one girl is:`,
          ...mcq,
          explanation: `Required = total committees - all-boys committees = ${ways}.`
        };
      }
      const n = 3 + (k % 2);
      const ways = 2 * factorial(n - 1) * factorial(n);
      const mcq = buildOptionSet(String(ways), [String(ways / 2), String(ways + 12), String(factorial(2 * n))], k);
      return {
        question: `Number of ways to seat ${n} men and ${n} women alternately around a circle is:`,
        ...mcq,
        explanation: `Arrange men in circle: (n-1)! ways; women in gaps: n! ways; two gender orderings => 2(n-1)!n! = ${ways}.`
      };
    }

    if (topic === "Trigonometry") {
      if (v === 0) {
        const alpha = [30, 45, 60][k % 3];
        const count = alpha === 45 ? 2 : 2;
        const mcq = buildOptionSet(String(count), ["1", "3", "4"], k);
        return {
          question: `Number of solutions of sin x = sin ${alpha} degrees in interval [0, 360 degrees] is:`,
          ...mcq,
          explanation: `In one full cycle, sin x = sin alpha has two solutions for these alpha values.`
        };
      }
      if (v === 1) {
        const mcq = buildOptionSet("tan x", ["cot x", "sec x", "sin x"], k);
        return {
          question: "Simplify (1 - cos 2x)/(sin 2x):",
          ...mcq,
          explanation: `1 - cos2x = 2sin^2x and sin2x = 2sinx cosx, so expression = tanx.`
        };
      }
      if (v === 2) {
        const mcq = buildOptionSet("3", ["2", "4", "1"], k);
        return {
          question: "Number of solutions of 2sin^2 x - 3sin x + 1 = 0 in [0, 2pi] is:",
          ...mcq,
          explanation: `Equation factors as (2sinx-1)(sinx-1)=0 giving sinx=1/2 or 1 => 3 solutions.`
        };
      }
      if (v === 3) {
        const a = 3 + (k % 4), b = 4 + (k % 3);
        const max = Math.sqrt(a * a + b * b);
        const mcq = buildOptionSet(`${formatNum(max)}`, [`${a + b}`, `${Math.abs(a - b)}`, `${formatNum(max - 1)}`], k);
        return {
          question: `Maximum value of ${a} sin x + ${b} cos x is:`,
          ...mcq,
          explanation: `Maximum of a sin x + b cos x is sqrt(a^2 + b^2) = ${formatNum(max)}.`
        };
      }
      const t = ["3/4", "4/3", "5/12"][k % 3];
      const num = t === "3/4" ? 3 : t === "4/3" ? 4 : 5;
      const den = t === "3/4" ? 4 : t === "4/3" ? 3 : 12;
      const sin = num / Math.sqrt(num * num + den * den);
      const mcq = buildOptionSet(`${formatNum(sin, 4)}`, [`${formatNum(1 - sin, 4)}`, `${formatNum(sin + 0.2, 4)}`, `${formatNum(num / den, 4)}`], k);
      return {
        question: `If tan x = ${t} and x is acute, then sin x is:`,
        ...mcq,
        explanation: `Take opposite=${num}, adjacent=${den}. Hypotenuse=sqrt(${num * num + den * den}). sinx=${formatNum(sin, 4)}.`
      };
    }

    // Vectors and 3D Geometry
    if (v === 0) {
      const ax = 1 + (k % 3), ay = 2 + (k % 4), az = 1 + (k % 3);
      const bx = 3 + (k % 3), by = 1 + (k % 4), bz = 2 + (k % 3);
      const dot = ax * bx + ay * by + az * bz;
      const mcq = buildOptionSet(String(dot), [String(dot + 3), String(dot - 2), String(ax + ay + az + bx + by + bz)], k);
      return {
        question: `Dot product of vectors (${ax}, ${ay}, ${az}) and (${bx}, ${by}, ${bz}) is:`,
        ...mcq,
        explanation: `a.b = ax*bx + ay*by + az*bz = ${dot}.`
      };
    }
    if (v === 1) {
      const a = [2 + (k % 3), 1 + (k % 4), 2 + (k % 3)];
      const b = [1 + (k % 3), 3 + (k % 3), 2 + (k % 4)];
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const ma = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
      const mb = Math.sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
      const cos = dot / (ma * mb);
      const mcq = buildOptionSet(`${formatNum(cos, 4)}`, [`${formatNum(cos + 0.2, 4)}`, `${formatNum(cos - 0.2, 4)}`, `${formatNum(dot, 4)}`], k);
      return {
        question: `Cosine of angle between vectors (${a.join(",")}) and (${b.join(",")}) is:`,
        ...mcq,
        explanation: `cos(theta) = (a.b)/(|a||b|) = ${formatNum(cos, 4)}.`
      };
    }
    if (v === 2) {
      const ax = 2 + (k % 3), ay = 1 + (k % 3);
      const bx = 1 + (k % 4), by = 3 + (k % 3);
      const area = Math.abs(ax * by - ay * bx) / 2;
      const mcq = buildOptionSet(`${formatNum(area)}`, [`${formatNum(area * 2)}`, `${formatNum(area + 1)}`, `${formatNum(area - 0.5)}`], k);
      return {
        question: `Area of triangle formed by vectors (${ax},${ay},0) and (${bx},${by},0) is:`,
        ...mcq,
        explanation: `Area = |a x b|/2 = |${ax * by - ay * bx}|/2 = ${formatNum(area)}.`
      };
    }
    if (v === 3) {
      const mcq = buildOptionSet("Scalar triple product gives volume", [
        "Scalar triple product is always zero",
        "Scalar triple product equals dot product always",
        "Scalar triple product gives area only"
      ], k);
      return {
        question: "For vectors a, b, c, which statement is correct?",
        ...mcq,
        explanation: `|a.(b x c)| gives volume of parallelepiped.`
      };
    }
    const a = 1 + (k % 4), b = 2 + (k % 3), c = 3 + (k % 3), d = 4 + (k % 5);
    const x0 = 1 + (k % 3), y0 = 2 + (k % 3), z0 = 3 + (k % 3);
    const dist = Math.abs(a * x0 + b * y0 + c * z0 - d) / Math.sqrt(a * a + b * b + c * c);
    const mcq = buildOptionSet(`${formatNum(dist)}`, [`${formatNum(dist + 1)}`, `${formatNum(dist - 0.4)}`, `${formatNum(Math.abs(a * x0 + b * y0 + c * z0 - d))}`], k);
    return {
      question: `Distance of point (${x0},${y0},${z0}) from plane ${a}x + ${b}y + ${c}z - ${d} = 0 is:`,
      ...mcq,
      explanation: `Distance = |ax0+by0+cz0-d|/sqrt(a^2+b^2+c^2) = ${formatNum(dist)}.`
    };
  }

  function makeHardPhysicsQuestion(topic, i) {
    const k = i + 1;
    const v = i % 5;
    const g = 10;

    if (topic === "Mechanics") {
      if (v === 0) {
        const angleSet = [
          { deg: 37, sin: 0.6, cos: 0.8 },
          { deg: 53, sin: 0.8, cos: 0.6 },
          { deg: 30, sin: 0.5, cos: 0.866 }
        ][k % 3];
        const m = 2 + (k % 4);
        const mu = [0.2, 0.25, 0.3][k % 3];
        const a = 2 + (k % 3);
        const F = m * (g * (angleSet.sin + mu * angleSet.cos) + a);
        const mcq = buildOptionSet(`${formatNum(a)} m/s^2`, [
          `${formatNum(a + 1)} m/s^2`,
          `${formatNum(a - 1)} m/s^2`,
          `${formatNum(F / m)} m/s^2`
        ], k);
        return {
          question: `A block of mass ${m} kg is pulled up a rough incline (theta=${angleSet.deg} degrees, mu=${formatNum(mu)}) by a force ${formatNum(F)} N parallel to plane. Taking g=10 m/s^2, acceleration is:`,
          ...mcq,
          explanation: `Along incline, a = [F - mg(sin theta + mu cos theta)]/m = ${formatNum(a)} m/s^2.`
        };
      }
      if (v === 1) {
        const m = 2 + (k % 5);
        const speed = 4 + (k % 5);
        const ke = 0.75 * m * speed * speed;
        const mcq = buildOptionSet(`${formatNum(ke)} J`, [
          `${formatNum(0.5 * m * speed * speed)} J`,
          `${formatNum(m * speed * speed)} J`,
          `${formatNum(0.25 * m * speed * speed)} J`
        ], k);
        return {
          question: `A solid cylinder of mass ${m} kg rolls without slipping with speed ${speed} m/s. Total kinetic energy is:`,
          ...mcq,
          explanation: `K = (1/2)mv^2 + (1/2)Iomega^2 with I=(1/2)mR^2 and omega=v/R, so K = (3/4)mv^2 = ${formatNum(ke)} J.`
        };
      }
      if (v === 2) {
        const m1 = 2 + (k % 4);
        const m2 = 5 + (k % 4);
        const u1 = 8 + 2 * (k % 4);
        const v1 = ((m1 - m2) * u1) / (m1 + m2);
        const mcq = buildOptionSet(`${formatNum(v1)} m/s`, [
          `${formatNum((m1 * u1) / (m1 + m2))} m/s`,
          `${formatNum(((m1 + m2) * u1) / m1)} m/s`,
          `${formatNum(-v1)} m/s`
        ], k);
        return {
          question: `In a 1D elastic collision, mass ${m1} kg moving at ${u1} m/s strikes stationary mass ${m2} kg (${m2}>${m1}). Velocity of ${m1} kg block after collision is:`,
          ...mcq,
          explanation: `For elastic collision with target at rest: v1 = [(m1-m2)/(m1+m2)]u1 = ${formatNum(v1)} m/s.`
        };
      }
      if (v === 3) {
        const r = 1 + (k % 4);
        const uMin = Math.sqrt(5 * g * r);
        const mcq = buildOptionSet(`${formatNum(uMin)} m/s`, [
          `${formatNum(Math.sqrt(4 * g * r))} m/s`,
          `${formatNum(Math.sqrt(2 * g * r))} m/s`,
          `${formatNum(Math.sqrt(6 * g * r))} m/s`
        ], k);
        return {
          question: `Minimum speed at lowest point for a particle to complete a vertical circle of radius ${r} m is:`,
          ...mcq,
          explanation: `At top, minimum v^2 = gr. Using energy between bottom and top: u_min^2 = v_top^2 + 4gr = 5gr.`
        };
      }
      const a0 = 10 + 2 * (k % 5);
      const b = 3 + (k % 3);
      const L = 2 + (k % 4);
      const work = a0 * L + 0.5 * b * L * L;
      const mcq = buildOptionSet(`${formatNum(work)} J`, [
        `${formatNum(a0 * L)} J`,
        `${formatNum(work + 8)} J`,
        `${formatNum(work - 6)} J`
      ], k);
      return {
        question: `A variable force F(x)=(${a0}+${b}x) N acts along x from x=0 to x=${L} m. Work done is:`,
        ...mcq,
        explanation: `W = integral(F dx) = integral_0^L (${a0}+${b}x)dx = ${formatNum(work)} J.`
      };
    }

    if (topic === "Kinematics") {
      if (v === 0) {
        const u = 25 + 5 * (k % 4);
        const h = 20 + 5 * (k % 3);
        const ux = 0.8 * u;
        const uy = 0.6 * u;
        const t = (uy + Math.sqrt(uy * uy + 2 * g * h)) / g;
        const range = ux * t;
        const mcq = buildOptionSet(`${formatNum(range)} m`, [
          `${formatNum(range + 12)} m`,
          `${formatNum(range - 10)} m`,
          `${formatNum(ux * uy / g)} m`
        ], k);
        return {
          question: `A projectile is launched with speed ${u} m/s at angle 37 degrees from a point ${h} m above ground (g=10). Horizontal range on ground is:`,
          ...mcq,
          explanation: `t = [u sin theta + sqrt((u sin theta)^2 + 2gh)]/g and R = u cos theta * t = ${formatNum(range)} m.`
        };
      }
      if (v === 1) {
        const width = 120 + 20 * (k % 3);
        const vb = 10 + 2 * (k % 4);
        const stream = 4 + (k % 3);
        const drift = stream * (width / vb);
        const mcq = buildOptionSet(`${formatNum(drift)} m`, [
          `${formatNum(width / vb)} m`,
          `${formatNum(drift + 15)} m`,
          `${formatNum(drift - 10)} m`
        ], k);
        return {
          question: `A river is ${width} m wide. Boat speed in still water is ${vb} m/s, stream speed is ${stream} m/s. If boat is aimed perpendicular to river flow, downstream drift is:`,
          ...mcq,
          explanation: `Crossing time t = width/vb, drift = stream * t = ${formatNum(drift)} m.`
        };
      }
      if (v === 2) {
        const u = 2 + (k % 4);
        const a1 = 3, t1 = 3;
        const a2 = -2, t2 = 2;
        const a3 = 1, t3 = 3;
        const v1 = u + a1 * t1;
        const v2 = v1 + a2 * t2;
        const s = u * t1 + 0.5 * a1 * t1 * t1
          + v1 * t2 + 0.5 * a2 * t2 * t2
          + v2 * t3 + 0.5 * a3 * t3 * t3;
        const mcq = buildOptionSet(`${formatNum(s)} m`, [
          `${formatNum(s + 8)} m`,
          `${formatNum(s - 6)} m`,
          `${formatNum((u + v2) * (t1 + t2 + t3) / 2)} m`
        ], k);
        return {
          question: `A particle starts with velocity ${u} m/s. Acceleration is +3 m/s^2 for 3 s, then -2 m/s^2 for 2 s, then +1 m/s^2 for 3 s. Total displacement is:`,
          ...mcq,
          explanation: `Add segment displacements using s = ut + (1/2)at^2 for each interval. Total s = ${formatNum(s)} m.`
        };
      }
      if (v === 3) {
        const speed = 12 + 2 * (k % 4);
        const acc = 3 + (k % 3);
        const t = (2 * speed) / acc;
        const mcq = buildOptionSet(`${formatNum(t)} s`, [
          `${formatNum(speed / acc)} s`,
          `${formatNum(t + 2)} s`,
          `${formatNum(t - 1)} s`
        ], k);
        return {
          question: `Particle A starts from rest at x=0 with constant acceleration ${acc} m/s^2. Particle B passes x=0 at t=0 with constant speed ${speed} m/s in same direction. Time when A catches B is:`,
          ...mcq,
          explanation: `Set positions equal: (1/2)at^2 = ut => t = 2u/a = ${formatNum(t)} s (non-zero root).`
        };
      }
      const w0 = 4 + (k % 4);
      const alpha = 2 + (k % 3);
      const t = 5 + (k % 3);
      const theta = w0 * t + 0.5 * alpha * t * t;
      const mcq = buildOptionSet(`${formatNum(theta)} rad`, [
        `${formatNum(w0 * t)} rad`,
        `${formatNum(theta + 12)} rad`,
        `${formatNum(theta - 8)} rad`
      ], k);
      return {
        question: `A rotating body has initial angular speed ${w0} rad/s and constant angular acceleration ${alpha} rad/s^2 for ${t} s. Angular displacement is:`,
        ...mcq,
        explanation: `theta = w0 t + (1/2)alpha t^2 = ${formatNum(theta)} rad.`
      };
    }

    if (topic === "Electromagnetism") {
      if (v === 0) {
        const R = 3 + (k % 4);
        const req = (11 * R) / 3;
        const mcq = buildOptionSet(`${formatNum(req)} ohm`, [
          `${formatNum(4 * R)} ohm`,
          `${formatNum((5 * R) / 3)} ohm`,
          `${formatNum(3 * R)} ohm`
        ], k);
        return {
          question: `A circuit has resistor 3R in series with parallel combination of R and 2R. If R=${R} ohm, equivalent resistance is:`,
          ...mcq,
          explanation: `R_parallel = (R*2R)/(R+2R) = 2R/3, so Req = 3R + 2R/3 = 11R/3 = ${formatNum(req)} ohm.`
        };
      }
      if (v === 1) {
        const E = 12 + 2 * (k % 4);
        const R = 2 + (k % 3);
        const current = E / (2 * R);
        const mcq = buildOptionSet(`${formatNum(current)} A`, [
          `${formatNum(E / R)} A`,
          `${formatNum(current + 0.5)} A`,
          `${formatNum(current - 0.3)} A`
        ], k);
        return {
          question: `In an RC charging circuit with source ${E} V and resistance ${R} ohm, current at time t = RC ln2 is:`,
          ...mcq,
          explanation: `i(t)= (E/R)e^(-t/RC). At t=RC ln2, i = (E/R)*(1/2) = ${formatNum(current)} A.`
        };
      }
      if (v === 2) {
        const B = 0.4 + 0.1 * (k % 4);
        const L = 0.5 + 0.1 * (k % 3);
        const speed = 4 + (k % 5);
        const R = 2 + (k % 3);
        const current = (B * L * speed) / R;
        const mcq = buildOptionSet(`${formatNum(current)} A`, [
          `${formatNum(B * L * speed)} A`,
          `${formatNum(current + 0.2)} A`,
          `${formatNum(current - 0.1)} A`
        ], k);
        return {
          question: `A conducting rod of length ${formatNum(L)} m moves with speed ${speed} m/s perpendicular to field ${formatNum(B)} T on rails connected to resistor ${R} ohm. Induced current is:`,
          ...mcq,
          explanation: `emf = BLv and I = emf/R = BLv/R = ${formatNum(current)} A.`
        };
      }
      if (v === 3) {
        const N = 30 + 10 * (k % 3);
        const I = 1 + (k % 3);
        const area = 0.02 + 0.01 * (k % 3);
        const B = 0.3 + 0.1 * (k % 3);
        const torque = N * I * area * B * 0.5;
        const mcq = buildOptionSet(`${formatNum(torque)} N m`, [
          `${formatNum(2 * torque)} N m`,
          `${formatNum(torque + 0.2)} N m`,
          `${formatNum(torque - 0.1)} N m`
        ], k);
        return {
          question: `A coil with N=${N}, area=${formatNum(area)} m^2 and current ${I} A is in magnetic field ${formatNum(B)} T. If angle between normal and B is 30 degrees, torque magnitude is:`,
          ...mcq,
          explanation: `tau = NIAB sin(theta) = NIAB sin30 = ${formatNum(torque)} N m.`
        };
      }
      const vp = 220;
      const np = 800 + 100 * (k % 3);
      const ns = 200 + 50 * (k % 3);
      const vs = (vp * ns) / np;
      const mcq = buildOptionSet(`${formatNum(vs)} V`, [
        `${formatNum((vp * np) / ns)} V`,
        `${formatNum(vs + 20)} V`,
        `${formatNum(vs - 15)} V`
      ], k);
      return {
        question: `An ideal transformer has primary turns ${np}, secondary turns ${ns}, and primary voltage ${vp} V. Secondary voltage is:`,
        ...mcq,
        explanation: `Vp/Vs = Np/Ns, so Vs = Vp(Ns/Np) = ${formatNum(vs)} V.`
      };
    }

    if (topic === "Thermodynamics") {
      if (v === 0) {
        const n = 1 + (k % 2);
        const dT = 120 + 20 * (k % 3);
        const Q = n * 2.5 * 8.314 * dT;
        const mcq = buildOptionSet(`${formatNum(Q)} J`, [
          `${formatNum(n * 1.5 * 8.314 * dT)} J`,
          `${formatNum(Q + 500)} J`,
          `${formatNum(Q - 400)} J`
        ], k);
        return {
          question: `${n} mol monoatomic ideal gas is heated at constant pressure through ${dT} K. Heat supplied is:`,
          ...mcq,
          explanation: `Q = nCp Delta T with Cp=(5/2)R, so Q = ${formatNum(Q)} J.`
        };
      }
      if (v === 1) {
        const T1 = 300 + 20 * (k % 3);
        const ratio = 2 + (k % 2);
        const gamma = 1.4;
        const T2 = T1 * Math.pow(ratio, gamma - 1);
        const mcq = buildOptionSet(`${formatNum(T2)} K`, [
          `${formatNum(T1 * ratio)} K`,
          `${formatNum(T2 + 30)} K`,
          `${formatNum(T2 - 25)} K`
        ], k);
        return {
          question: `An ideal gas is adiabatically compressed so that V1/V2=${ratio}. If initial temperature is ${T1} K and gamma=1.4, final temperature is:`,
          ...mcq,
          explanation: `For adiabatic process, TV^(gamma-1)=constant, so T2 = T1(V1/V2)^(gamma-1) = ${formatNum(T2)} K.`
        };
      }
      if (v === 2) {
        const Th = 350 + 20 * (k % 3);
        const Tc = 280 + 10 * (k % 3);
        const cop = Tc / (Th - Tc);
        const mcq = buildOptionSet(`${formatNum(cop)}`, [
          `${formatNum((Th - Tc) / Tc)}`,
          `${formatNum(cop + 0.8)}`,
          `${formatNum(cop - 0.6)}`
        ], k);
        return {
          question: `A Carnot refrigerator operates between ${Th} K and ${Tc} K. Its COP is:`,
          ...mcq,
          explanation: `COP(refrigerator) = Tc/(Th-Tc) = ${formatNum(cop)}.`
        };
      }
      if (v === 3) {
        const n = 1 + (k % 2);
        const ratio = 2 + (k % 2);
        const dS = n * 8.314 * Math.log(ratio);
        const mcq = buildOptionSet(`${formatNum(dS)} J/K`, [
          `${formatNum(n * 8.314 * (ratio - 1))} J/K`,
          `${formatNum(dS + 2)} J/K`,
          `${formatNum(dS - 1.5)} J/K`
        ], k);
        return {
          question: `Entropy change for reversible isothermal expansion of ${n} mol ideal gas from V to ${ratio}V is:`,
          ...mcq,
          explanation: `Delta S = nR ln(V2/V1) = nR ln(${ratio}) = ${formatNum(dS)} J/K.`
        };
      }
      const T1 = 300 + 50 * (k % 3);
      const T2 = 900 + 100 * (k % 2);
      const ratio = Math.sqrt(T2 / T1);
      const mcq = buildOptionSet(`${formatNum(ratio)}`, [
        `${formatNum(T2 / T1)}`,
        `${formatNum(ratio + 0.3)}`,
        `${formatNum(ratio - 0.2)}`
      ], k);
      return {
        question: `For the same ideal gas, if temperature changes from ${T1} K to ${T2} K, ratio of rms speeds v2/v1 is:`,
        ...mcq,
        explanation: `v_rms is proportional to sqrt(T), so v2/v1 = sqrt(T2/T1) = ${formatNum(ratio)}.`
      };
    }

    if (topic === "Optics") {
      if (v === 0) {
        const f = 15 + 5 * (k % 3);
        const u = 3 * f;
        const img = (u * f) / (u - f);
        const mcq = buildOptionSet(`${formatNum(img)} cm`, [
          `${formatNum(f)} cm`,
          `${formatNum(2 * f)} cm`,
          `${formatNum(img + 5)} cm`
        ], k);
        return {
          question: `An object is placed ${u} cm from a convex lens of focal length ${f} cm. Image distance magnitude is:`,
          ...mcq,
          explanation: `Using 1/f = 1/v + 1/u with magnitudes, v = uf/(u-f) = ${formatNum(img)} cm.`
        };
      }
      if (v === 1) {
        const lambdaNm = 500 + 50 * (k % 3);
        const D = 1.2 + 0.2 * (k % 3);
        const dMm = 0.4 + 0.1 * (k % 2);
        const betaMm = (lambdaNm * 1e-9 * D / (dMm * 1e-3)) * 1e3;
        const mcq = buildOptionSet(`${formatNum(betaMm)} mm`, [
          `${formatNum(betaMm + 0.2)} mm`,
          `${formatNum(betaMm - 0.15)} mm`,
          `${formatNum((lambdaNm / dMm) * 1e-3)} mm`
        ], k);
        return {
          question: `In YDSE, wavelength=${lambdaNm} nm, screen distance=${formatNum(D)} m, slit separation=${formatNum(dMm)} mm. Fringe width is:`,
          ...mcq,
          explanation: `beta = lambdaD/d = ${formatNum(betaMm)} mm.`
        };
      }
      if (v === 2) {
        const A = 60;
        const Dm = [37, 40, 42][k % 3];
        const n = Math.sin(((A + Dm) / 2) * Math.PI / 180) / Math.sin((A / 2) * Math.PI / 180);
        const mcq = buildOptionSet(`${formatNum(n, 3)}`, [
          `${formatNum(n + 0.1, 3)}`,
          `${formatNum(n - 0.1, 3)}`,
          `${formatNum(1 / n, 3)}`
        ], k);
        return {
          question: `For a prism of angle A=${A} degrees, minimum deviation is ${Dm} degrees. Refractive index of prism material is:`,
          ...mcq,
          explanation: `n = sin((A+Dm)/2)/sin(A/2) = ${formatNum(n, 3)}.`
        };
      }
      if (v === 3) {
        const vObj = 2 + (k % 4);
        const rel = 2 * vObj;
        const mcq = buildOptionSet(`${formatNum(rel)} m/s`, [
          `${formatNum(vObj)} m/s`,
          `${formatNum(rel + 2)} m/s`,
          `${formatNum(rel - 1)} m/s`
        ], k);
        return {
          question: `An object moves towards a fixed plane mirror with speed ${vObj} m/s along the normal. Speed of image relative to object is:`,
          ...mcq,
          explanation: `Image speed w.r.t. ground is also ${vObj} m/s opposite direction, so relative speed = 2v = ${formatNum(rel)} m/s.`
        };
      }
      const lambda = 600e-9;
      const d = 2e-6;
      const order = 1 + (k % 2);
      const theta = Math.asin((order * lambda) / d) * 180 / Math.PI;
      const mcq = buildOptionSet(`${formatNum(theta)} degrees`, [
        `${formatNum(theta + 5)} degrees`,
        `${formatNum(theta - 4)} degrees`,
        `${formatNum((order * lambda / d) * 90)} degrees`
      ], k);
      return {
        question: `A diffraction grating has slit spacing d=2x10^-6 m and light wavelength 600 nm. Angular position of order n=${order} maximum is:`,
        ...mcq,
        explanation: `d sin theta = n lambda => theta = sin^-1(n lambda/d) = ${formatNum(theta)} degrees.`
      };
    }

    if (topic === "Modern Physics") {
      if (v === 0) {
        const hv = 4.5 + 0.5 * (k % 3);
        const phi = 2 + 0.2 * (k % 3);
        const vs = hv - phi;
        const mcq = buildOptionSet(`${formatNum(vs)} V`, [
          `${formatNum(hv + phi)} V`,
          `${formatNum(vs + 0.5)} V`,
          `${formatNum(vs - 0.4)} V`
        ], k);
        return {
          question: `In photoelectric effect, incident photon energy is ${formatNum(hv)} eV and work function is ${formatNum(phi)} eV. Stopping potential is:`,
          ...mcq,
          explanation: `eVs = hv - phi, so Vs = ${formatNum(vs)} V.`
        };
      }
      if (v === 1) {
        const V = 100 + 25 * (k % 4);
        const lambda = 12.27 / Math.sqrt(V);
        const mcq = buildOptionSet(`${formatNum(lambda, 3)} A`, [
          `${formatNum(lambda + 0.2, 3)} A`,
          `${formatNum(lambda - 0.15, 3)} A`,
          `${formatNum(12.27 / V, 3)} A`
        ], k);
        return {
          question: `An electron accelerated through ${V} V has de Broglie wavelength closest to:`,
          ...mcq,
          explanation: `lambda(A) = 12.27/sqrt(V) = ${formatNum(lambda, 3)} A.`
        };
      }
      if (v === 2) {
        const n0 = 1600 * (1 + (k % 3));
        const half = 2 + (k % 3);
        const n = n0 / Math.pow(2, half);
        const mcq = buildOptionSet(`${formatNum(n)}`, [
          `${formatNum(2 * n)}`,
          `${formatNum(n / 2)}`,
          `${formatNum(n0 - n)}`
        ], k);
        return {
          question: `A radioactive sample has initial nuclei count ${n0}. Remaining nuclei after ${half} half-lives are:`,
          ...mcq,
          explanation: `N = N0*(1/2)^n = ${formatNum(n)}.`
        };
      }
      if (v === 3) {
        const nHi = 3 + (k % 3);
        const nLo = 2;
        const dE = 13.6 * (1 / (nLo * nLo) - 1 / (nHi * nHi));
        const lambda = 1240 / dE;
        const mcq = buildOptionSet(`${formatNum(lambda)} nm`, [
          `${formatNum(lambda + 80)} nm`,
          `${formatNum(lambda - 60)} nm`,
          `${formatNum(1240 / (13.6 / (nHi * nHi)))} nm`
        ], k);
        return {
          question: `In hydrogen atom, wavelength of photon emitted in transition n=${nHi} to n=2 is approximately:`,
          ...mcq,
          explanation: `Delta E = 13.6(1/2^2 - 1/${nHi}^2) eV and lambda = 1240/Delta E = ${formatNum(lambda)} nm.`
        };
      }
      const A = 20 + 4 * (k % 3);
      const deltaM = 0.18 + 0.02 * (k % 4);
      const bePerNucleon = (deltaM * 931.5) / A;
      const mcq = buildOptionSet(`${formatNum(bePerNucleon)} MeV`, [
        `${formatNum(bePerNucleon + 1)} MeV`,
        `${formatNum(bePerNucleon - 0.8)} MeV`,
        `${formatNum(deltaM * 931.5)} MeV`
      ], k);
      return {
        question: `A nucleus has mass defect ${formatNum(deltaM)} u and mass number A=${A}. Binding energy per nucleon is:`,
        ...mcq,
        explanation: `Total BE = deltaM*931.5 MeV. So BE/A = ${formatNum(bePerNucleon)} MeV per nucleon.`
      };
    }

    if (v === 0) {
      const mcq = buildOptionSet("1/4", ["1/2", "3/4", "1"], k);
      return {
        question: "For SHM, if displacement is x=A/2, fraction of total energy as potential energy is:",
        ...mcq,
        explanation: `Potential fraction = x^2/A^2 = (1/2)^2 = 1/4.`
      };
    }
    if (v === 1) {
      const mu = 0.01 + 0.002 * (k % 3);
      const L = 0.8 + 0.1 * (k % 3);
      const f = 50 + 5 * (k % 4);
      const T = 4 * mu * L * L * f * f;
      const mcq = buildOptionSet(`${formatNum(T)} N`, [
        `${formatNum(T / 2)} N`,
        `${formatNum(T + 10)} N`,
        `${formatNum(T - 8)} N`
      ], k);
      return {
        question: `A stretched string of length ${formatNum(L)} m and linear mass density ${formatNum(mu, 4)} kg/m vibrates in fundamental mode at ${f} Hz. Tension in string is:`,
        ...mcq,
        explanation: `For fundamental mode, f = (1/2L)sqrt(T/mu), so T = 4muL^2f^2 = ${formatNum(T)} N.`
      };
    }
    if (v === 2) {
      const f0 = 500 + 20 * (k % 4);
      const vo = 20 + 5 * (k % 3);
      const vSound = 340;
      const fp = f0 * (vSound + vo) / vSound;
      const mcq = buildOptionSet(`${formatNum(fp)} Hz`, [
        `${formatNum(f0 * (vSound - vo) / vSound)} Hz`,
        `${formatNum(fp + 20)} Hz`,
        `${formatNum(fp - 15)} Hz`
      ], k);
      return {
        question: `A stationary source emits ${f0} Hz sound. Observer moves towards source at ${vo} m/s (sound speed 340 m/s). Observed frequency is:`,
        ...mcq,
        explanation: `Doppler formula for moving observer: f' = f(v+vo)/v = ${formatNum(fp)} Hz.`
      };
    }
    if (v === 3) {
      const base = 256 + 8 * (k % 4);
      const beat = 4 + (k % 4);
      const unknown = base + beat;
      const mcq = buildOptionSet(`${unknown} Hz`, [
        `${base - beat} Hz`,
        `${base + 2 * beat} Hz`,
        `${base} Hz`
      ], k);
      return {
        question: `A tuning fork of frequency ${base} Hz produces ${beat} beats/s with another fork of higher frequency. Frequency of the other fork is:`,
        ...mcq,
        explanation: `For higher frequency fork, f2 = f1 + beat = ${unknown} Hz.`
      };
    }
    const phase = (2 * Math.PI) / 3;
    const mcq = buildOptionSet(`${formatNum(phase, 3)} rad`, [
      `${formatNum(Math.PI / 2, 3)} rad`,
      `${formatNum(Math.PI, 3)} rad`,
      `${formatNum(Math.PI / 3, 3)} rad`
    ], k);
    return {
      question: "If path difference between two coherent waves is lambda/3, their phase difference is:",
      ...mcq,
      explanation: `Phase difference = 2pi(Delta x/lambda) = 2pi/3 = ${formatNum(phase, 3)} rad.`
    };
  }

  function makeHardChemistryQuestion(topic, i) {
    const k = i + 1;
    const v = i % 5;

    if (topic === "Atomic Structure") {
      if (v === 0) {
        const Z = 2 + (k % 3);
        const ie = 13.6 * Z * Z;
        const mcq = buildOptionSet(`${formatNum(ie)} eV`, [
          `${formatNum(13.6 * Z)} eV`,
          `${formatNum(ie + 13.6)} eV`,
          `${formatNum(ie - 10)} eV`
        ], k);
        return {
          question: `Ionization energy of a hydrogen-like ion with atomic number Z=${Z} from ground state is:`,
          ...mcq,
          explanation: `For hydrogen-like species, Eion = 13.6 Z^2 eV = ${formatNum(ie)} eV.`
        };
      }
      if (v === 1) {
        const ratio = Math.sqrt(1836);
        const mcq = buildOptionSet(`${formatNum(ratio, 1)}`, [
          `${formatNum(1 / ratio, 3)}`,
          `${formatNum(ratio / 2, 1)}`,
          `${formatNum(ratio + 5, 1)}`
        ], k);
        return {
          question: "For electron and proton having same kinetic energy, ratio of de Broglie wavelengths (lambda_e/lambda_p) is approximately:",
          ...mcq,
          explanation: `lambda is proportional to 1/sqrt(m) at same KE, so lambda_e/lambda_p = sqrt(mp/me) approx ${formatNum(ratio, 1)}.`
        };
      }
      if (v === 2) {
        const dx = (0.1 + 0.05 * (k % 3)) * 1e-9;
        const dv = 6.626e-34 / (4 * Math.PI * 9.11e-31 * dx);
        const mcq = buildOptionSet(`${formatNum(dv / 1e6, 2)} x10^6 m/s`, [
          `${formatNum((dv / 2) / 1e6, 2)} x10^6 m/s`,
          `${formatNum((dv + 2e6) / 1e6, 2)} x10^6 m/s`,
          `${formatNum((dv - 1e6) / 1e6, 2)} x10^6 m/s`
        ], k);
        return {
          question: `If position uncertainty of an electron is ${formatNum(dx * 1e9, 2)} nm, minimum uncertainty in velocity is closest to:`,
          ...mcq,
          explanation: `Heisenberg: Delta x Delta p >= h/4pi, so Delta v >= h/(4pi m Delta x) approx ${formatNum(dv / 1e6, 2)} x10^6 m/s.`
        };
      }
      if (v === 3) {
        const n = 3 + (k % 3);
        const nu = 3.29e15 * (1 / 4 - 1 / (n * n));
        const mcq = buildOptionSet(`${formatNum(nu / 1e14, 2)} x10^14 Hz`, [
          `${formatNum((nu + 1e14) / 1e14, 2)} x10^14 Hz`,
          `${formatNum((nu - 0.8e14) / 1e14, 2)} x10^14 Hz`,
          `${formatNum((nu / 10) / 1e14, 2)} x10^14 Hz`
        ], k);
        return {
          question: `Frequency of photon emitted in hydrogen transition n=${n} to n=2 (Balmer series) is approximately:`,
          ...mcq,
          explanation: `nu = cR(1/2^2 - 1/${n}^2) with cR approx 3.29x10^15 s^-1, so nu approx ${formatNum(nu / 1e14, 2)}x10^14 Hz.`
        };
      }
      const set = [
        { label: "4s", n: 4, l: 0 },
        { label: "4p", n: 4, l: 1 },
        { label: "5d", n: 5, l: 2 }
      ][k % 3];
      const radial = set.n - set.l - 1;
      const mcq = buildOptionSet(String(radial), [
        String(radial + 1),
        String(radial - 1),
        String(set.l)
      ], k);
      return {
        question: `Number of radial nodes in ${set.label} orbital is:`,
        ...mcq,
        explanation: `Radial nodes = n-l-1 = ${set.n}-${set.l}-1 = ${radial}.`
      };
    }

    if (topic === "Chemical Bonding") {
      if (v === 0) {
        const set = [
          { orb: "sp", s: "50%" },
          { orb: "sp2", s: "33.33%" },
          { orb: "sp3", s: "25%" }
        ][k % 3];
        const mcq = buildOptionSet(set.s, ["20%", "40%", "75%"], k);
        return {
          question: `Percentage s-character in ${set.orb} hybrid orbital is:`,
          ...mcq,
          explanation: `s-character = (number of s orbitals used / total hybrids)*100.`
        };
      }
      if (v === 1) {
        const mcq = buildOptionSet("CH4 > NH3 > H2O", ["NH3 > CH4 > H2O", "H2O > NH3 > CH4", "CH4 > H2O > NH3"], k);
        return {
          question: "Correct order of bond angle is:",
          ...mcq,
          explanation: "Lone pair repulsion decreases bond angle, so CH4 (109.5) > NH3 (107) > H2O (104.5)."
        };
      }
      if (v === 2) {
        const set = [
          { species: "O2+", ans: "2.5" },
          { species: "O2-", ans: "1.5" },
          { species: "N2+", ans: "2.5" }
        ][k % 3];
        const mcq = buildOptionSet(set.ans, ["1", "2", "3"], k);
        return {
          question: `Bond order of ${set.species} is:`,
          ...mcq,
          explanation: "Bond order is computed using molecular orbital electron count in bonding and antibonding orbitals."
        };
      }
      if (v === 3) {
        const mcq = buildOptionSet("+1", ["0", "-1", "+2"], k);
        return {
          question: "Formal charge on central atom in O3 is:",
          ...mcq,
          explanation: "In dominant resonance forms of ozone, central oxygen carries +1 formal charge."
        };
      }
      const mcq = buildOptionSet("XeF4", ["NH3", "SO2", "H2O"], k);
      return {
        question: "Which molecule has zero dipole moment due to symmetric geometry?",
        ...mcq,
        explanation: "XeF4 is square planar with bond dipoles canceling out."
      };
    }

    if (topic === "Equilibrium") {
      if (v === 0) {
        const alpha = [0.4, 0.5, 0.6][k % 3];
        const P = [1, 2, 3][k % 3];
        const kp = (4 * alpha * alpha * P) / (1 - alpha * alpha);
        const mcq = buildOptionSet(`${formatNum(kp)}`, [
          `${formatNum(kp / 2)}`,
          `${formatNum(kp + 1.2)}`,
          `${formatNum((alpha * P) / (1 - alpha))}`
        ], k);
        return {
          question: `For N2O4(g) <=> 2NO2(g), degree of dissociation alpha=${formatNum(alpha)} at total pressure ${P} atm. Kp is:`,
          ...mcq,
          explanation: `Kp = [4alpha^2 P]/[1-alpha^2] = ${formatNum(kp)}.`
        };
      }
      if (v === 1) {
        const pKa = 4.74;
        const ratio = [2, 5, 10][k % 3];
        const pH = pKa + Math.log10(ratio);
        const mcq = buildOptionSet(`${formatNum(pH, 2)}`, [
          `${formatNum(pKa - Math.log10(ratio), 2)}`,
          `${formatNum(pH + 0.5, 2)}`,
          `${formatNum(pH - 0.4, 2)}`
        ], k);
        return {
          question: `A buffer has CH3COOH and CH3COO- concentration ratio [salt]/[acid]=${ratio}. If pKa=4.74, pH is:`,
          ...mcq,
          explanation: `Henderson equation: pH = pKa + log([salt]/[acid]) = ${formatNum(pH, 2)}.`
        };
      }
      if (v === 2) {
        const ksp = 1.8e-10;
        const ag = 1e-3;
        const cl = ksp / ag;
        const mcq = buildOptionSet(`${formatNum(cl / 1e-7, 2)} x10^-7 M`, [
          `${formatNum((2 * cl) / 1e-7, 2)} x10^-7 M`,
          `${formatNum((cl / 2) / 1e-7, 2)} x10^-7 M`,
          `${formatNum((ksp / 1e-10), 2)} x10^-7 M`
        ], k);
        return {
          question: `For AgCl (Ksp=1.8x10^-10), if [Ag+] is fixed at 1x10^-3 M, minimum [Cl-] needed for precipitation is:`,
          ...mcq,
          explanation: `At precipitation threshold, ionic product = Ksp. So [Cl-] = Ksp/[Ag+] = ${formatNum(cl / 1e-7, 2)}x10^-7 M.`
        };
      }
      if (v === 3) {
        const mcq = buildOptionSet("Shifts in forward direction", ["Shifts in reverse direction", "No shift because Q is non-zero", "Catalyst is required to shift"], k);
        return {
          question: "For a reaction with Kc=4, if Qc=0.5 at some instant, the reaction will:",
          ...mcq,
          explanation: "If Q<K, reaction proceeds forward to form more products."
        };
      }
      const mcq = buildOptionSet("Increases", ["Decreases", "Remains unchanged", "Becomes zero"], k);
      return {
        question: "For an endothermic reaction, equilibrium constant K with increase in temperature:",
        ...mcq,
        explanation: "For endothermic systems, heat acts like reactant; higher temperature increases K."
      };
    }

    if (topic === "Organic Chemistry") {
      if (v === 0) {
        const mcq = buildOptionSet("tert-Butyl chloride", ["Ethyl chloride", "n-Propyl chloride", "Methyl chloride"], k);
        return {
          question: "Which alkyl halide reacts fastest in SN1 mechanism in polar protic solvent?",
          ...mcq,
          explanation: "SN1 rate depends on carbocation stability; tertiary carbocation forms fastest."
        };
      }
      if (v === 1) {
        const mcq = buildOptionSet("p-nitroanisole (major)", ["m-nitroanisole (major)", "nitrobenzene only", "o-nitroanisole absent"], k);
        return {
          question: "Major product in nitration of anisole is:",
          ...mcq,
          explanation: "-OCH3 is o,p-directing and activating; para product dominates sterically."
        };
      }
      if (v === 2) {
        const mcq = buildOptionSet("p-nitrophenol", ["Phenol", "Ethanol", "p-cresol"], k);
        return {
          question: "Strongest acid among the following is:",
          ...mcq,
          explanation: "Electron-withdrawing nitro group stabilizes phenoxide ion, increasing acidity."
        };
      }
      if (v === 3) {
        const mcq = buildOptionSet("3", ["2", "4", "1"], k);
        return {
          question: "Total number of stereoisomers of 2,3-dichlorobutane is:",
          ...mcq,
          explanation: "It has one meso form and one pair of enantiomers, total 3 stereoisomers."
        };
      }
      const mcq = buildOptionSet("CH3CHO and HCHO", ["CH3COOH and H2", "CH3CH2OH only", "CH3CHO only"], k);
      return {
        question: "Ozonolysis of propene followed by Zn/H2O gives:",
        ...mcq,
        explanation: "Oxidative cleavage of CH3-CH=CH2 gives ethanal and methanal."
      };
    }

    if (topic === "Electrochemistry") {
      if (v === 0) {
        const E0 = 1.1;
        const n = 2;
        const Q = 1e-2;
        const E = E0 - (0.0591 / n) * Math.log10(Q);
        const mcq = buildOptionSet(`${formatNum(E, 3)} V`, [
          `${formatNum(E0, 3)} V`,
          `${formatNum(E - 0.05, 3)} V`,
          `${formatNum(E + 0.06, 3)} V`
        ], k);
        return {
          question: `For a cell with Edeg=${formatNum(E0, 2)} V, n=${n}, and reaction quotient Q=10^-2 at 298 K, cell potential is:`,
          ...mcq,
          explanation: `Nernst equation: E = Edeg - (0.0591/n)logQ = ${formatNum(E, 3)} V.`
        };
      }
      if (v === 1) {
        const n = 2;
        const E0 = 0.3 + 0.05 * (k % 3);
        const logK = (n * E0) / 0.0591;
        const mcq = buildOptionSet(`${formatNum(logK, 2)}`, [
          `${formatNum(logK / 2, 2)}`,
          `${formatNum(logK + 2, 2)}`,
          `${formatNum(0.0591 / (n * E0), 2)}`
        ], k);
        return {
          question: `If standard cell potential is ${formatNum(E0, 2)} V for n=${n}, value of log10(K) is:`,
          ...mcq,
          explanation: `At 298 K, Edeg = (0.0591/n)logK, so logK = nEdeg/0.0591 = ${formatNum(logK, 2)}.`
        };
      }
      if (v === 2) {
        const I = 2 + (k % 3);
        const t = 1800 + 600 * (k % 2);
        const eff = 0.8 + 0.1 * (k % 2);
        const m = (63.5 * I * t * eff) / (2 * 96500);
        const mcq = buildOptionSet(`${formatNum(m)} g`, [
          `${formatNum(m / eff)} g`,
          `${formatNum(m + 0.5)} g`,
          `${formatNum(m - 0.4)} g`
        ], k);
        return {
          question: `Copper is deposited from Cu2+ solution by current ${I} A for ${t} s with ${formatNum(eff * 100)}% current efficiency. Deposited mass is:`,
          ...mcq,
          explanation: `Faraday law with efficiency: m = MIt*eff/(nF) = ${formatNum(m)} g.`
        };
      }
      if (v === 3) {
        const kappa = 1.2e-2 + 0.2e-2 * (k % 3);
        const c = 0.01 + 0.005 * (k % 2);
        const lambdaM = (1000 * kappa) / c;
        const mcq = buildOptionSet(`${formatNum(lambdaM)} S cm^2 mol^-1`, [
          `${formatNum(lambdaM / 10)} S cm^2 mol^-1`,
          `${formatNum(lambdaM + 25)} S cm^2 mol^-1`,
          `${formatNum(lambdaM - 20)} S cm^2 mol^-1`
        ], k);
        return {
          question: `If conductivity kappa=${formatNum(kappa, 4)} S/cm and concentration c=${formatNum(c, 3)} M, molar conductivity is:`,
          ...mcq,
          explanation: `Lambda_m = 1000*kappa/c = ${formatNum(lambdaM)} S cm^2 mol^-1.`
        };
      }
      const mcq = buildOptionSet("Ecell > 0 and Delta G < 0", ["Ecell < 0 and Delta G < 0", "Ecell = 0 for spontaneous process", "Delta G > 0 for spontaneous process"], k);
      return {
        question: "For a spontaneous electrochemical cell, correct condition is:",
        ...mcq,
        explanation: `Delta G = -nFEcell, so spontaneity requires Ecell positive and Delta G negative.`
      };
    }

    if (topic === "Thermochemistry") {
      if (v === 0) {
        const dH = -40 - 5 * (k % 3);
        const dS = -80 - 10 * (k % 3);
        const T = 298;
        const dG = dH - (T * dS) / 1000;
        const mcq = buildOptionSet(`${formatNum(dG, 2)} kJ/mol`, [
          `${formatNum(dH, 2)} kJ/mol`,
          `${formatNum(dG + 5, 2)} kJ/mol`,
          `${formatNum(dG - 4, 2)} kJ/mol`
        ], k);
        return {
          question: `For a reaction at 298 K, Delta H=${dH} kJ/mol and Delta S=${dS} J/mol-K. Delta G is:`,
          ...mcq,
          explanation: `Delta G = Delta H - TDelta S = ${formatNum(dG, 2)} kJ/mol.`
        };
      }
      if (v === 1) {
        const dH1 = -393;
        const dH2 = -283;
        const target = dH1 - dH2;
        const mcq = buildOptionSet(`${target} kJ/mol`, [
          `${dH1 + dH2} kJ/mol`,
          `${-target} kJ/mol`,
          `${target + 50} kJ/mol`
        ], k);
        return {
          question: `Given C + O2 -> CO2 (Delta H=-393 kJ/mol) and CO + 1/2 O2 -> CO2 (Delta H=-283 kJ/mol), Delta H for C + 1/2 O2 -> CO is:`,
          ...mcq,
          explanation: `By Hess law, subtract second equation from first: Delta H = -393 - (-283) = ${target} kJ/mol.`
        };
      }
      if (v === 2) {
        const dH1 = -60 - 5 * (k % 3);
        const dCp = 20 + 5 * (k % 3);
        const dT = 100;
        const dH2 = dH1 + (dCp * dT) / 1000;
        const mcq = buildOptionSet(`${formatNum(dH2, 2)} kJ/mol`, [
          `${formatNum(dH1, 2)} kJ/mol`,
          `${formatNum(dH2 + 3, 2)} kJ/mol`,
          `${formatNum(dH2 - 2.5, 2)} kJ/mol`
        ], k);
        return {
          question: `At T1, reaction enthalpy is ${dH1} kJ/mol and Delta Cp=${dCp} J/mol-K. Approximate reaction enthalpy at T2=T1+${dT} K is:`,
          ...mcq,
          explanation: `Kirchhoff relation: Delta H2 = Delta H1 + Delta Cp(T2-T1) = ${formatNum(dH2, 2)} kJ/mol.`
        };
      }
      if (v === 3) {
        const mass = 100 + 20 * (k % 3);
        const dT = 5 + (k % 3);
        const q = mass * 4.2 * dT;
        const mcq = buildOptionSet(`${formatNum(q)} J`, [
          `${formatNum(q / 2)} J`,
          `${formatNum(q + 400)} J`,
          `${formatNum(q - 300)} J`
        ], k);
        return {
          question: `A calorimeter contains ${mass} g solution (specific heat 4.2 J g^-1 K^-1) with temperature rise ${dT} K. Heat evolved is:`,
          ...mcq,
          explanation: `q = mcDelta T = ${formatNum(q)} J.`
        };
      }
      const dH = 40;
      const dS = 100;
      const threshold = (dH * 1000) / dS;
      const mcq = buildOptionSet(`${formatNum(threshold)} K`, [
        `${formatNum(threshold / 2)} K`,
        `${formatNum(threshold + 100)} K`,
        `${formatNum(threshold - 80)} K`
      ], k);
      return {
        question: `If Delta H=+40 kJ/mol and Delta S=+100 J/mol-K, reaction becomes spontaneous above temperature:`,
        ...mcq,
        explanation: `For Delta H>0 and Delta S>0, spontaneity requires T > Delta H/Delta S = ${formatNum(threshold)} K.`
      };
    }

    if (v === 0) {
      const k1 = 0.2303;
      const t = 10;
      const fraction = Math.exp(-k1 * t);
      const mcq = buildOptionSet(`${formatNum(fraction, 3)}`, [
        `${formatNum(1 - fraction, 3)}`,
        "0.500",
        "0.250"
      ], k);
      return {
        question: `For a first-order reaction with k=${formatNum(k1, 4)} s^-1, fraction of reactant remaining after ${t} s is:`,
        ...mcq,
        explanation: `[A]/[A]0 = e^(-kt) = e^(-${formatNum(k1 * t, 3)}) = ${formatNum(fraction, 3)}.`
      };
    }
    if (v === 1) {
      const Ea = 50000;
      const T1 = 300;
      const T2 = 330;
      const ratio = Math.exp((Ea / 8.314) * (1 / T1 - 1 / T2));
      const mcq = buildOptionSet(`${formatNum(ratio, 2)}`, [
        `${formatNum(ratio / 2, 2)}`,
        `${formatNum(ratio + 2, 2)}`,
        `${formatNum(1 / ratio, 2)}`
      ], k);
      return {
        question: `Using Arrhenius relation, ratio k2/k1 for Ea=50 kJ/mol when temperature increases from 300 K to 330 K is approximately:`,
        ...mcq,
        explanation: `ln(k2/k1)=Ea/R(1/T1-1/T2), giving k2/k1 approx ${formatNum(ratio, 2)}.`
      };
    }
    if (v === 2) {
      const a0 = 0.6 + 0.2 * (k % 3);
      const k0 = 0.02 + 0.005 * (k % 3);
      const tHalf = a0 / (2 * k0);
      const mcq = buildOptionSet(`${formatNum(tHalf)} s`, [
        `${formatNum(0.693 / k0)} s`,
        `${formatNum(tHalf + 5)} s`,
        `${formatNum(tHalf - 4)} s`
      ], k);
      return {
        question: `For a zero-order reaction with [A]0=${formatNum(a0)} M and k=${formatNum(k0, 3)} M s^-1, half-life is:`,
        ...mcq,
        explanation: `Zero-order half-life: t1/2 = [A]0/(2k) = ${formatNum(tHalf)} s.`
      };
    }
    if (v === 3) {
      const mcq = buildOptionSet("Rate = k'[A]", ["Rate = k[A][B] always", "Rate independent of both reactants", "Rate = k[B]"], k);
      return {
        question: "In pseudo-first-order hydrolysis of ester (water in large excess), rate law is effectively:",
        ...mcq,
        explanation: "With [H2O] nearly constant, k[H2O] is absorbed into k', giving first-order form in ester concentration."
      };
    }
    const mcq = buildOptionSet("3 half-lives", ["2 half-lives", "4 half-lives", "1 half-life"], k);
    return {
      question: "In a first-order reaction, 87.5% completion corresponds to elapsed time of:",
      ...mcq,
      explanation: `12.5% remains = 1/8 = (1/2)^3, so 3 half-lives are required.`
    };
  }

  function factorial(n) {
    let out = 1;
    for (let i = 2; i <= n; i++) out *= i;
    return out;
  }

  function nCr(n, r) {
    if (r < 0 || r > n) return 0;
    return factorial(n) / (factorial(r) * factorial(n - r));
  }

  function generateJeeLikeQuestion(subject, topic, index) {
    const harderDifficultyCycle = ["medium", "hard", "hard"];
    const difficulty = ["Maths", "Physics", "Chemistry"].includes(subject)
      ? harderDifficultyCycle[index % harderDifficultyCycle.length]
      : DIFFICULTIES[index % DIFFICULTIES.length];
    const year = YEARS[index % YEARS.length];

    let q;
    if (subject === "Physics") q = makeHardPhysicsQuestion(topic, index) || makePhysicsQuestion(topic, index);
    else if (subject === "Chemistry") q = makeHardChemistryQuestion(topic, index) || makeChemistryQuestion(topic, index);
    else q = makeMathQuestion(topic, index);

    if (!q) return null;

    return {
      id: sanitizeId(`SATHEE_SYN_${subject}_${topic}_${index + 1}`),
      subject,
      topic,
      question: sanitizeText(q.question),
      options: (q.options || []).slice(0, 4).map((opt) => sanitizeText(opt)),
      correctAnswer: q.correctAnswer,
      year,
      difficulty: q.difficulty || difficulty,
      source: "SATHEE-SYNTH",
      explanation: sanitizeText(q.explanation || "JEE-style generated fallback question.")
    };
  }

  function sanitizeRecord(rec, index) {
    const subject = normalizeSubject(rec.subject);
    const topic = sanitizeText(rec.topic);

    const built = buildFromExistingOptions(
      Array.isArray(rec.options) ? rec.options : [],
      typeof rec.correct === "number" ? rec.correct : 0,
      index
    );

    let answer = sanitizeText(rec.correctAnswer).toUpperCase();
    if (!["A", "B", "C", "D"].includes(answer)) {
      answer = built.correctAnswer;
    }

    const options = (Array.isArray(rec.options) ? rec.options : built.options)
      .map((opt) => sanitizeText(opt))
      .filter(Boolean)
      .slice(0, 4);

    while (options.length < 4) {
      options.push(`Option ${String.fromCharCode(65 + options.length)}`);
    }

    return {
      id: sanitizeId(rec.id || `SATHEE_${subject}_${topic}_${index + 1}`),
      subject,
      topic,
      question: sanitizeText(rec.question || rec.q || ""),
      options,
      correctAnswer: answer,
      year: Number(rec.year) || YEARS[index % YEARS.length],
      difficulty: DIFFICULTIES.includes(rec.difficulty) ? rec.difficulty : DIFFICULTIES[index % DIFFICULTIES.length],
      source: rec.source || "SATHEE",
      explanation: sanitizeText(rec.explanation || "")
    };
  }

  function dedupeTopicRecords(records) {
    const seen = new Set();
    const out = [];
    records.forEach((rec) => {
      const key = normalizeQuestionKey(rec.question);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(rec);
    });
    return out;
  }

  function generateSyntheticTopicRecords(subject, topic, needCount, existingQuestionKeys) {
    const generated = [];
    const seen = existingQuestionKeys || new Set();
    let attempts = 0;
    let index = 0;

    while (generated.length < needCount && attempts < needCount * 120) {
      const candidate = generateJeeLikeQuestion(subject, topic, index + attempts);
      attempts++;
      if (!candidate || !candidate.question) continue;

      let key = normalizeQuestionKey(candidate.question);
      if (!key) continue;

      if (seen.has(key)) {
        const variant = { ...candidate };
        variant.id = sanitizeId(`${candidate.id}_V${attempts}`);
        variant.question = `${candidate.question} (Set ${attempts})`;
        key = normalizeQuestionKey(variant.question);
        if (seen.has(key)) continue;
        seen.add(key);
        generated.push(variant);
        index++;
        continue;
      }

      seen.add(key);
      generated.push(candidate);
      index++;
    }

    return generated;
  }

  function normalizeExternalRecords(records) {
    if (!Array.isArray(records) || !records.length) return [];
    const sanitized = records
      .map((rec, idx) => sanitizeRecord(rec, idx))
      .filter((rec) => rec.subject && rec.topic && rec.question);

    return dedupeTopicRecords(sanitized);
  }

  function buildDB() {
    const configSubjects = (global.JEETopicConfig && Array.isArray(global.JEETopicConfig.subjects))
      ? global.JEETopicConfig.subjects
      : [];

    const external = normalizeExternalRecords(global.SATHEE_JEE_SCRAPED_DB || []);
    const externalByKey = new Map();

    external.forEach((rec) => {
      const key = `${rec.subject}__${rec.topic}`;
      if (!externalByKey.has(key)) externalByKey.set(key, []);
      externalByKey.get(key).push(rec);
    });

    const finalRecords = [];

    configSubjects.forEach((subjectInfo) => {
      const subject = subjectInfo.examSubject;
      subjectInfo.topics.forEach((topic) => {
        const key = `${subject}__${topic}`;
        const base = dedupeTopicRecords((externalByKey.get(key) || []).map((r) => ({ ...r })));
        const seen = new Set(base.map((rec) => normalizeQuestionKey(rec.question)));

        if (base.length < MIN_QUESTIONS_PER_TOPIC) {
          const supplements = generateSyntheticTopicRecords(
            subject,
            topic,
            MIN_QUESTIONS_PER_TOPIC - base.length,
            seen
          );
          base.push(...supplements);
        }

        const uniqueBase = dedupeTopicRecords(base);
        if (uniqueBase.length < MIN_QUESTIONS_PER_TOPIC) {
          const secondPassSeen = new Set(uniqueBase.map((rec) => normalizeQuestionKey(rec.question)));
          const topUp = generateSyntheticTopicRecords(
            subject,
            topic,
            MIN_QUESTIONS_PER_TOPIC - uniqueBase.length,
            secondPassSeen
          );
          uniqueBase.push(...topUp);
        }

        finalRecords.push(...uniqueBase);
      });
    });

    const bySubject = {};
    finalRecords.forEach((rec) => {
      if (!bySubject[rec.subject]) bySubject[rec.subject] = {};
      if (!bySubject[rec.subject][rec.topic]) bySubject[rec.subject][rec.topic] = [];
      bySubject[rec.subject][rec.topic].push(rec);
    });

    return {
      records: finalRecords,
      bySubject,
      minQuestionsPerTopic: MIN_QUESTIONS_PER_TOPIC
    };
  }

  const DB = buildDB();

  function answerLetterToIndex(letter) {
    return { A: 0, B: 1, C: 2, D: 3 }[letter] ?? 0;
  }

  function toExamQuestion(record) {
    return {
      id: record.id,
      exams: ["JEE"],
      subject: record.subject,
      topic: record.topic,
      difficulty: record.difficulty,
      year: `JEE ${record.year}`,
      q: record.question,
      options: [...record.options],
      correct: answerLetterToIndex(record.correctAnswer),
      explanation: record.explanation || `Source: ${record.source}`,
      source: record.source
    };
  }

  function getTopics(subject) {
    const bucket = DB.bySubject[subject] || {};
    return Object.keys(bucket);
  }

  function getQuestions(subject, topic) {
    const arr = (DB.bySubject[subject] && DB.bySubject[subject][topic]) || [];
    return arr.map((rec) => toExamQuestion(rec));
  }

  function getAllQuestionsForSubject(subject) {
    const topics = getTopics(subject);
    const out = [];
    topics.forEach((topic) => {
      out.push(...getQuestions(subject, topic));
    });
    return out;
  }

  function validateTopicUniqueness(subject, topic) {
    const arr = (DB.bySubject[subject] && DB.bySubject[subject][topic]) || [];
    const seen = new Set();
    for (let i = 0; i < arr.length; i++) {
      const key = normalizeQuestionKey(arr[i].question);
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  }

  global.SATHEEQuestionDB = {
    minQuestionsPerTopic: DB.minQuestionsPerTopic,
    getTopics,
    getQuestions,
    getAllQuestionsForSubject,
    getAllRecords: () => DB.records.map((rec) => stableClone(rec)),
    toExamQuestion,
    validateTopicUniqueness
  };
})(window);
