# Booking Conversational Agent

This project is a production-ready AI Conversational Agent for a Hostaway-like Property Management System (PMS). It features a modern, responsive frontend built with React.js and a powerful Python backend powered by Google Gemini.

## Features

*   **Conversational AI**: Engage in natural, human-like conversations with the AI assistant.
*   **Tool Calling**: The assistant can interact with a mock PMS API to perform tasks like checking availability, getting quotes, and modifying bookings.
*   **Retrieval-Augmented Generation (RAG)**: The assistant can answer frequently asked questions by retrieving information from a knowledge base.
*   **Speech-to-Text and Text-to-Speech**: Interact with the assistant using your voice and hear its responses spoken out loud.
*   **Modern UI**: A beautiful and intuitive user interface built with React.js, featuring:
    *   Light and dark modes.
    *   Settings panel for customization.
    *   Real-time conversation with typing indicators.
*   **Scalable Architecture**: The backend is built with Flask and is designed to be scalable and modular.

## Architecture

The system is designed as a set of decoupled services. The main components are:

*   **React Frontend**: The user interface for the chat application.
*   **Flask Backend**: The server that handles the chat logic, interacts with the Gemini API, and serves the frontend.
*   **Google Gemini**: The large language model that powers the conversational AI.
*   **Mock PMS API**: A simulated Property Management System API for tool-calling demonstrations.
*   **RAG System**: A Retrieval-Augmented Generation system for answering FAQs from a knowledge base.

## Getting Started

### Prerequisites

*   Node.js and npm
*   Python 3.7+ and pip
*   A Google API key

### Installation

1.  **Clone the repository:**
    ```
    git clone https://github.com/Kushal-Chandani/Booking-Conversational-Agent.git
    cd Booking-Conversational-Agent
    ```

2.  **Create a `.env` file** in the root of the project with the following content:
    ```
    GOOGLE_API_KEY=YOUR_API_KEY
    MODEL_NAME=gemini-pro
    ```
    Replace `YOUR_API_KEY` with your actual Google API key.

### Running the Application

1.  **Run the Frontend:**
    *   Navigate to the `frontend` directory:
        ```
        cd frontend
        ```
    *   Install the dependencies:
        ```
        npm install
        ```
    *   Start the React development server:
        ```
        npm start
        ```
        The frontend will be running at `http://localhost:3000`.

2.  **Run the Backend:**
    *   Install the required Python packages:
        ```
        pip install -r requirements.txt
        ```
    *   Run the Flask server:
        ```
        python main.py
        ```
        The backend will be running at `http://localhost:5000`.
