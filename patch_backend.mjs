import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendPath = path.join(__dirname, 'server/index.js');

let oldCode = fs.readFileSync(backendPath, 'utf8');

const GOOGLE_ID = '186299576876-htp2d7p6vstk8q5hqe4lahg6q6bgdpr0.apps.googleusercontent.com';

const newImports = `
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client('${GOOGLE_ID}');
`;

if (!oldCode.includes('google-auth-library')) {
    oldCode = oldCode.replace("import jwt from 'jsonwebtoken';", "import jwt from 'jsonwebtoken';" + newImports);
}

const newRoutes = `

// Google Sign-In Route
app.post('/api/auth/google/signin', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '${GOOGLE_ID}',
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = users.get(email);
    if (!user) {
      // Return error if user does not exist but is trying to log in
      return res.status(401).json({ error: "No account found with this Google email. Please sign up first." });
    }

    const { passwordHash: _p, ...safeUser } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error("Google verify error:", error);
    res.status(401).json({ error: "Invalid Google Token" });
  }
});

// Google Sign-Up Route
app.post('/api/auth/google/signup', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '${GOOGLE_ID}',
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    let user = users.get(email);
    if (user) {
         // Proceed to login if user already exists
    } else {
        const generatedPasswordHash = await bcrypt.hash(Date.now().toString(), 10);
        user = {
            id: Date.now().toString(),
            name: name,
            email: email,
            grade: '11',
            stream: 'PCM',
            passwordHash: generatedPasswordHash,
            createdAt: new Date().toISOString()
        };
        users.set(email, user);
    }

    const { passwordHash: _p, ...safeUser } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error("Google signup error:", error);
    res.status(401).json({ error: "Invalid Google Token" });
  }
});
`;

if (!oldCode.includes('/api/auth/google/signin')) {
    oldCode = oldCode.replace("// Log In", newRoutes + "\n  // Log In");
}

fs.writeFileSync(backendPath, oldCode);
console.log("Successfully patched server/index.js");
