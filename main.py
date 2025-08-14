import os
import json
import google.generativeai as genai
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import pms_api
from rag import RAG

load_dotenv()

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app)
rag_retriever = RAG()

logging.basicConfig(level=logging.INFO)

# Load credentials from .env file
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")

genai.configure(api_key=GOOGLE_API_KEY)

tools = {
    "check_availability": pms_api.check_availability,
    "get_quote": pms_api.get_quote,
    "modify_booking": pms_api.modify_booking,
    "send_message_to_host": pms_api.send_message_to_host,
}

model = genai.GenerativeModel(model_name=MODEL_NAME, tools=tools.values())

@app.route('/chat', methods=['POST'])
def chat():
    messages = request.json['messages']
    
    # Convert messages to Gemini format
    gemini_messages = []
    for msg in messages:
        role = 'user' if msg['sender'] == 'user' else 'model'
        gemini_messages.append({'role': role, 'parts': [msg['text']]})

    user_message = gemini_messages[-1]['parts'][0]
    
    # Moderation (Gemini has built-in safety settings)
    
    context = rag_retriever.search(user_message)
    
    if context:
        context_str = "\n\n".join([f"Q: {item['question']}\nA: {item['answer']}" for item in context])
        system_prompt = f"You are a helpful booking assistant. Today's date is 2025-08-15. Here is some information that might be relevant to the user's question:\n\n{context_str}"
        # For Gemini, we prepend the context to the user's message
        gemini_messages[-1]['parts'][0] = f"{system_prompt}\n\nUser question: {user_message}"

    try:
        chat_session = model.start_chat(history=gemini_messages[:-1])
        response = chat_session.send_message(gemini_messages[-1]['parts'])
        
        function_call = response.candidates[0].content.parts[0].function_call
        if function_call:
            function_name = function_call.name
            function_args = {key: value for key, value in function_call.args.items()}
            function_to_call = tools[function_name]
            function_response = function_to_call(**function_args)
            
            response = chat_session.send_message(
                [
                    {"function_response": {"name": function_name, "response": json.loads(function_response)}}
                ]
            )

        bot_response = response.text

    except Exception as e:
        logging.error(f"Gemini API error: {e}")
        bot_response = "Sorry, I'm having trouble connecting to the AI service."

    return jsonify({'response': bot_response})

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
