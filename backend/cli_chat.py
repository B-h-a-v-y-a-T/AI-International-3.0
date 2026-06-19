import urllib.request
import json
import urllib.error

print("\n" + "="*55)
print("🧠 Mental State Backend - Interactive Chat Terminal")
print("="*55)
print("This will send messages directly to your Flask server.")
print("Type your message below. Type 'quit' to exit.\n")

def main():
    while True:
        try:
            # 1. Get input from user in terminal
            user_input = input("🗣️  You: ")
            
            if user_input.strip().lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break
                
            if not user_input.strip():
                continue

            # 2. Send the message to the /analyze route
            req = urllib.request.Request(
                'http://localhost:5050/analyze', 
                data=json.dumps({"message": str(user_input), "user_id": "terminal_user"}).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            res = urllib.request.urlopen(req).read().decode('utf-8')
            analyze_data = json.loads(res)

            # 3. Fetch the updated /risk score
            req2 = urllib.request.Request('http://localhost:5050/risk?user_id=terminal_user')
            res2 = urllib.request.urlopen(req2).read().decode('utf-8')
            risk_data = json.loads(res2)

            # 4. Print formatted results
            print(f"🤖 Model:  Sentiment [{analyze_data['sentiment']['label']}] | Frustration [{analyze_data['emotion']['frustration']:.2f}] | Confusion [{analyze_data['emotion']['confusion']:.2f}]")
            
            reasons = ", ".join(risk_data['reasons']) if risk_data['reasons'] else "Normal conversation"
            print(f"⚠️  Risk:   {risk_data['level']} (Score: {risk_data['risk_score']}) -> {reasons}\n")

        except urllib.error.URLError:
            print(f"\n❌ Error: Could not connect to Http://localhost:5050. Is the Flask app running?\n")
        except Exception as e:
            print(f"\n❌ Error: {e}\n")

if __name__ == '__main__':
    main()
