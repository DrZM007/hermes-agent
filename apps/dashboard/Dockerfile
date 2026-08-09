# HERMES//HUB — zero-dependency stdlib server. The only optional extra is the
# official `anthropic` SDK, which unlocks the live Jarvis agent when
# HERMES_HUB_API_KEY is provided; everything else runs without it.
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir anthropic

# All server modules — server.py imports assistant/automations/ics/indicators/
# evolve/telemetry, and assistant imports router. Copy the whole set so adding
# a module can't silently break the image at import time.
COPY *.py sample_data.json ./
COPY public ./public

# Fail the build (not the deploy) if anything is missing at import time.
RUN python -c "import server"

# Persist notes/tasks/sync state, feeds, calendars, automations and memory.
VOLUME /data

EXPOSE 8787

# HERMES_HUB_TOKEN   → access code required by browsers/API clients (recommended)
# HERMES_HUB_API_KEY → Anthropic API key for the live agent (optional)
# HERMES_HUB_MODEL   → override the Claude model (optional)
CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "8787", "--data-dir", "/data"]
