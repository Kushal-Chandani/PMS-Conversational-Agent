# AI Conversation Agent for a Property Management System (PMS)

This document outlines the design and architecture for a production-ready AI Conversation Agent for a Hostaway-like Property Management System (PMS).

## 1. Architecture

The system is designed as a modular, scalable, and observable set of microservices.

### Components:

1.  **Guest Channels**: The entry points for guest interactions (e.g., Website Chat Widget, WhatsApp, SMS, Email).
2.  **API Gateway / Ingress**: A single, secure entry point for all incoming messages. It handles authentication, rate limiting, and routes requests to the appropriate services.
3.  **Message Queue**: A system like RabbitMQ or AWS SQS to decouple the gateway from the core processing logic. This ensures that no messages are lost during traffic spikes and allows for asynchronous processing.
4.  **Orchestrator**: The core of the system. This service manages the conversation flow, calls the LLM, executes tools, and maintains the conversation state.
5.  **LLM Service**: A service that abstracts the interactions with the chosen Large Language Model(s). This allows for easy swapping of models and can manage model-specific logic.
6.  **Tool Executor**: A service that executes the PMS API calls (e.g., checking availability, fetching quotes). This isolates the core logic from the external API integrations.
7.  **Vector Store**: A database like Pinecone or a self-hosted solution with FAISS for storing and retrieving information for Retrieval-Augmented Generation (RAG). This is used for answering FAQs from a knowledge base.
8.  **PMS API**: The external Property Management System API (e.g., Hostaway).
9.  **Moderation & Observability**: Services that handle content moderation, logging, tracing, and metrics.

### Data Flow Diagram:

```
Guest Channels (Web Chat, WhatsApp, etc.)
       |
       v
API Gateway / Ingress (Authentication, Rate Limiting)
       |
       v
Message Queue (e.g., RabbitMQ, SQS)
       |
       v
Orchestrator (State Machine/Graph)
       |
       |<------------------> LLM Service (e.g., OpenAI, Anthropic)
       |
       |<------------------> Tool Executor
       |                        |
       |                        v
       |                      PMS API (Availability, Bookings)
       |
       |<------------------> Vector Store (for RAG on FAQs)
       |
       v
Moderation & Observability (Logging, Tracing, Guardrails)
       |
       v
(Response back through the same chain to the Guest)
```

### Hosting Choices:

*   **Cloud Provider**: AWS, Google Cloud, or Azure. AWS is a strong choice due to its mature ecosystem of services (Lambda, SQS, EKS, S3).
*   **Containerization**: Docker for packaging the services.
*   **Orchestration**: Kubernetes (like AWS EKS) for managing and scaling the containerized applications. Serverless functions (like AWS Lambda) can be used for specific, stateless tasks.

## 2. Orchestration Approach

A **State Machine** approach is recommended for the orchestrator. Each state represents a specific point in the conversation (e.g., `greeting`, `gathering_requirements`, `tool_calling`, `human_handoff`). This provides a structured and predictable conversation flow, which is crucial for a production system.

**Tool-calling points** will be integrated into the states. For example, in the `gathering_requirements` state, if the user asks for availability, the orchestrator transitions to a `tool_calling` state, executes the `check_availability` tool, and then uses the result to inform the next response.

## 3. LLM and Embedding Choices

*   **Primary LLM**: A model like **OpenAI's GPT-4o** or **Anthropic's Claude 3 Sonnet** is a good choice for their strong reasoning and tool-calling capabilities.
*   **Embedding Model**: For multilingual support and fast responses, a model like **`sentence-transformers/paraphrase-multilingual-mpnet-base-v2`** is a strong, open-source choice. It's efficient and supports a wide range of languages.

## 4. PMS Tool/Function Schema

The following is a proposed schema for the functions that the LLM can call.

```json
[
  {
    "name": "check_availability",
    "description": "Check property availability for given dates.",
    "parameters": {
      "type": "object",
      "properties": {
        "property_id": { "type": "string" },
        "start_date": { "type": "string", "format": "date" },
        "end_date": { "type": "string", "format": "date" }
      },
      "required": ["property_id", "start_date", "end_date"]
    }
  },
  {
    "name": "get_quote",
    "description": "Get a price quote for a stay.",
    "parameters": {
      "type": "object",
      "properties": {
        "property_id": { "type": "string" },
        "start_date": { "type": "string", "format": "date" },
        "end_date": { "type": "string", "format": "date" },
        "num_guests": { "type": "integer" }
      },
      "required": ["property_id", "start_date", "end_date", "num_guests"]
    }
  },
  {
    "name": "modify_booking",
    "description": "Request a modification to an existing booking.",
    "parameters": {
      "type": "object",
      "properties": {
        "booking_id": { "type": "string" },
        "new_start_date": { "type": "string", "format": "date" },
        "new_end_date": { "type": "string", "format": "date" }
      },
      "required": ["booking_id"]
    }
  },
  {
    "name": "send_message_to_host",
    "description": "Escalate to a human by sending a message to the host.",
    "parameters": {
      "type": "object",
      "properties": {
        "message": { "type": "string" }
      },
      "required": ["message"]
    }
  }
]
```

## 5. Prompting Strategy

*   **System Prompt**: The system prompt will be detailed and will instruct the LLM on its role, personality, and constraints. It will include instructions to be helpful, polite, and to use the provided tools.
*   **Few-shot Learning**: Include examples of conversations and tool use in the prompt to guide the model's behavior.
*   **Output Validation**: The output from the LLM (especially for tool calls) will be validated against the JSON schema. If the output is invalid, the system will re-prompt the LLM with an error message, asking it to correct the output.

## 6. Guardrails

*   **Anti-Hallucination**:
    *   **Grounding**: Use Retrieval-Augmented Generation (RAG) to ground the LLM's responses in factual information from the PMS and the knowledge base.
    *   **Strict Tool Use**: For factual questions (like availability or pricing), force the LLM to use tools rather than relying on its parametric memory.
*   **Sensitive Content Handling**:
    *   **PII Redaction**: Use a PII detection service (like AWS Comprehend or a custom solution) to redact sensitive information before it's sent to the LLM.
    *   **Content Moderation**: Use a moderation API (like OpenAI's Moderation endpoint) to filter out harmful or inappropriate content.

## 7. Edge-Case Handling

*   **Ambiguous Queries**: If a user's query is ambiguous, the agent will ask clarifying questions.
*   **Unsupported Requests**: For requests outside of its capabilities, the agent will politely state its limitations and offer to escalate to a human.
*   **Human Handoff**: A clear and seamless process for escalating to a human agent will be implemented. This will be triggered by keywords (e.g., "talk to a human") or by the agent's inability to resolve an issue after a few attempts.

## 8. Detailed Flow: Availability & Booking

**Scenario**: A guest asks "Hi, is your beach house available for the last week of August?"

1.  **Guest Message**: "Hi, is your beach house available for the last week of August?"
2.  **Orchestrator**: Receives the message. The state is `greeting`. The orchestrator identifies the intent as checking availability.
3.  **LLM Call (Parameter Extraction)**: The orchestrator sends a prompt to the LLM to extract the necessary parameters for the `check_availability` tool.
    *   **System Prompt**: "You are a helpful assistant. Your job is to extract parameters for tool calls. Today's date is August 15, 2025."
    *   **User Message**: "Hi, is your beach house available for the last week of August?"
    *   **LLM Response (JSON)**: `{ "property_id": "beach-house-123", "start_date": "2025-08-24", "end_date": "2025-08-31" }`
4.  **Tool Call**: The orchestrator validates the JSON and calls the `check_availability` tool with the extracted parameters.
5.  **PMS API Response**: `{"available": true, "price_per_night": 300}`
6.  **LLM Call (Response Generation)**: The orchestrator sends the tool's output to the LLM to generate a human-readable response.
    *   **System Prompt**: "You are a helpful booking assistant. You have just received the result of a tool call. Formulate a friendly response for the user."
    *   **Tool Output**: `Availability for property 'beach-house-123' from 2025-08-24 to 2025-08-31: Available. Price per night: $300.`
    *   **LLM Response**: "Good news! The beach house is available from August 24th to August 31st. The price is $300 per night. Would you like me to get a full quote for your stay?"
7.  **Guest Response**: "Yes, please!"
8.  **(Conversation continues to the quoting and booking flow...)**

This detailed flow demonstrates how the system uses the LLM for both understanding the user's intent and for generating natural language responses, while relying on tools for factual information.
