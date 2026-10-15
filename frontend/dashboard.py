
import streamlit as st
import requests

API_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="PromptShield AI",
    page_icon="🛡️",
    layout="wide",
)

st.title("🛡️ PromptShield AI")
st.caption("AI Prompt Security Gateway | Detect • Inspect • Protect")

st.divider()

# Status panel
try:
    response = requests.get(f"{API_URL}/health", timeout=3)
    api_online = response.status_code == 200
except requests.RequestException:
    api_online = False

if api_online:
    st.success("Backend connected")
else:
    st.error("Backend offline — start the FastAPI server first.")

st.subheader("Prompt Security Scanner")
st.write(
    "Inspect a prompt for common sensitive information "
    "and suspicious prompt-injection phrases."
)

prompt = st.text_area(
    "Enter a prompt to inspect",
    height=180,
    placeholder="Example: Ignore all previous instructions...",
)

if st.button("🔍 Inspect Prompt", type="primary"):
    if not prompt.strip():
        st.warning("Please enter a prompt first.")
    else:
        try:
            response = requests.post(
                f"{API_URL}/inspect",
                json={"text": prompt},
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()

                st.divider()
                st.subheader("Security Analysis")

                col1, col2 = st.columns(2)

                with col1:
                    if result["action"] == "BLOCK":
                        st.error(f"🚫 Action: {result['action']}")
                    else:
                        st.success(f"✅ Action: {result['action']}")

                with col2:
                    st.metric("Risk Level", result["risk"])

                st.write(result["message"])

                st.subheader("Findings")
                if result["findings"]:
                    for finding in result["findings"]:
                        st.warning(f"⚠️ {finding}")
                else:
                    st.info("No known risks detected by the current checks.")

            else:
                st.error(f"API error: HTTP {response.status_code}")

        except requests.RequestException:
            st.error(
                "Could not connect to the backend. "
                "Check that FastAPI is running at http://127.0.0.1:8000."
            )

st.divider()
st.caption(
    "Prototype notice: Detection uses basic rules and may miss threats "
    "or flag harmless text. Do not rely on it as a complete security system."
)
