"""
Jarvis LLM Client - Phase 2

Loads the action registry (shared source of truth), builds a system prompt that
forces Ollama to reply in the Phase 0 tool-call JSON shape, and validates whatever
comes back before anything is allowed to reach an action handler.

This module does NOT execute actions. It only decides "is this a safe, well-formed
instruction" and hands back a parsed result. Execution is Phase 3's job (Windows Agent).
"""

import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "mistral"          # matches "mistral-7b" in the dashboard mockup
CONFIDENCE_THRESHOLD = 0.6
ACTION_REGISTRY_PATH = "../shared/action-registry.json"


def load_action_registry() -> dict:
    with open(ACTION_REGISTRY_PATH, "r") as f:
        data = json.load(f)
    return {a["action"]: a for a in data["actions"]}


ACTIONS = load_action_registry()


def build_system_prompt() -> str:
    action_list = "\n".join(
        f'- {name} (tier: {info["tier"]}, params: {info["params"]})'
        for name, info in ACTIONS.items()
    )
    return f"""You are Jarvis, a local voice assistant. You control the user's Windows PC.

You may ONLY use these actions, exactly as named below. Never invent a new action name:
{action_list}

Always respond with ONLY a JSON object, no other text, in this exact shape:
{{
  "reply_text": "<what you would say out loud to the user>",
  "action": {{
    "name": "<one of the action names above, or null if no action is needed>",
    "params": {{}},
    "confidence": <float 0-1, how sure you are this is the right action>
  }}
}}

If the user is just asking a question with no side effect, set "action" to null.
Never include markdown formatting or commentary outside the JSON object.
"""

# Send transcribed text to Ollama with the tool-call system prompt, format: json
def call_llm(user_text: str) -> dict:
    """Sends user_text to Ollama, returns the raw parsed dict (not yet validated)."""
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": user_text},
        ],
        "stream": False,
        "format": "json",  # Ollama's structured-output mode, keeps it honest
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=15)
    response.raise_for_status()
    raw_content = response.json()["message"]["content"]

    return json.loads(raw_content)

# Checks the action name exists in registry
def validate(llm_output: dict) -> dict:
    """
    Checks the LLM's response against the action registry.
    Returns a dict: {"reply_text": str, "action": dict|None, "valid": bool, "reason": str|None}
    """
    reply_text = llm_output.get("reply_text", "")
    action = llm_output.get("action")

    if not action or action.get("name") is None:
        return {"reply_text": reply_text, "action": None, "valid": True, "reason": None}

    name = action.get("name")
    confidence = action.get("confidence", 0)

    if name not in ACTIONS:
        return {
            "reply_text": reply_text,
            "action": None,
            "valid": False,
            "reason": f"unknown action '{name}' — not in registry, refusing to execute",
        }

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "reply_text": reply_text,
            "action": None,
            "valid": False,
            "reason": f"confidence {confidence} below threshold {CONFIDENCE_THRESHOLD}",
        }

    expected_params = set(ACTIONS[name]["params"])
    given_params = set(action.get("params", {}).keys())
    if not expected_params.issubset(given_params):
        return {
            "reply_text": reply_text,
            "action": None,
            "valid": False,
            "reason": f"missing params for '{name}': expected {expected_params}, got {given_params}",
        }

    return {
        "reply_text": reply_text,
        "action": action,
        "valid": True,
        "reason": None,
    }


def process(user_text: str) -> dict:
    """Full pipeline: call LLM, validate, return a safe result for main.py to act on."""
    try:
        raw = call_llm(user_text)
    except (requests.RequestException, json.JSONDecodeError, KeyError) as e:
        return {
            "reply_text": "Sorry, I had trouble reaching my reasoning engine.",
            "action": None,
            "valid": False,
            "reason": str(e),
        }

    return validate(raw)

# prints what would execute, tagged with tier, calls out that HIGH tier actions 
# Needed Phase 6's confirmation step — nothing gets silently auto-executed
def dispatch_stub(result: dict) -> None:
    """
    Phase 2 stand-in for the Windows Agent. Prints what WOULD execute.
    Phase 3 replaces this with a real HTTP call to the agent per the
    Orchestrator <-> Agent contract from Phase 0.
    """
    action = result.get("action")
    if action is None:
        return

    tier = ACTIONS[action["name"]]["tier"]
    print(f"[dispatch-stub] would execute: {action['name']} "
          f"(tier={tier}) params={action.get('params', {})}")

    if tier == "HIGH":
        print("[dispatch-stub] HIGH tier action — Phase 6 will require explicit confirmation here")