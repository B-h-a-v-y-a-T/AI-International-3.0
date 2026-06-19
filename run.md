# Run Instructions for AdaptEd Ai (Vega-Vedant)

### **1. Prerequisites**
Ensure you have **Node.js** installed on your system.

### **2. Setup & Installation**

Navigate to the project directory and install the required dependencies:

```bash
cd c:\Users\Kushal\Desktop\Vega-hack\Vega-Vedant
npm install
```

### **What does `npm install` install?**
This command reads the `package.json` file and installs the following core dependencies:
*   **express**: Web server framework.
*   **@google/generative-ai**: Google Gemini API client for the AI Tutor.
*   **sentiment**: Emotion detection engine.
*   **jsonwebtoken & bcryptjs**: Secure authentication and password hashing.
*   **cors**: Cross-Origin Resource Sharing for API communication.
*   **dotenv**: Environment variable management (loads keys from `.env`).

### **3. Start the Server**
Run the following command to launch the backend:

```bash
npm run server
```

### **4. Access the App**
Once the terminal says "AdaptEd Ai API running on http://localhost:5050", open:
**[http://localhost:5050/login.html](http://localhost:5050/login.html)**
