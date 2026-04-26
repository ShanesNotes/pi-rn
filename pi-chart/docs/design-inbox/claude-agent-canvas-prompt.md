# Claude Design Prompt: Pi-Chart Agent Canvas

You are a senior product designer and frontend prototyper working from two existing HTML prototypes:

- `pi-chart-cockpit.html`: the preferred chart/cockpit direction. Preserve its patient banner, left navigation rhythm, dense clinical cockpit feel, and restrained Porsche-like visual language.
- `pi-chart-scratchpad.html`: a useful but imperfect Pi-agent integration sketch. Treat this as concept material, not a layout to copy. Its right-side chat drawer is probably the wrong final hierarchy.

Design and implement a new high-fidelity prototype named:

`Pi-Chart Agent Canvas.html`

Core metaphor:

If Epic EHR is a fully loaded American family SUV, Pi-chart is a Porsche. The UI should feel precise, fast, clinically serious, low-friction, and purpose-built. Do not make a generic SaaS dashboard, marketing page, or decorative AI chat app.

Product direction:

Pi-chart should keep the cockpit/chart as the canonical source of truth. Pi-agent should not take over the Overview. Instead, create a separate `Agent Canvas` tab alongside `Overview`.

Required information architecture:

1. Persistent top patient banner
   - Keep the patient banner at the top of the page.
   - It should show patient identity, acuity/watcher status, constraints, as-of time, and draft/cycle status.
   - The banner should remain clinically useful, compact, and scan-first.

2. Left navigation
   - Preserve the cockpit-style left sidebar.
   - Include `Overview` and `Agent Canvas` as first-class navigation items.
   - Keep chart primitives visible: vitals, timeline/events, narrative, constraints, open loops, handoff.
   - The sidebar should feel like clinical instrument navigation, not app marketing navigation.

3. Overview tab
   - This is the cockpit.
   - Keep vitals, narrative, event stream, open loops, and current chart state.
   - Demote agent activity to subtle staged-draft indicators only.
   - The Overview should not feel like a chat surface.

4. Agent Canvas tab
   - This is the documentation workbench.
   - Main center area: a structured note/canvas workspace where the clinician can review and edit generated draft content.
   - Bottom area: chat console with scrolling conversation history and fixed input box. Chat is the process, not the product.
   - Right drawer: generated artifact scratchpad, not chat.

5. Right artifact drawer inside Agent Canvas
   - The right drawer should list generated artifacts as structured objects:
     - reassessment draft
     - handoff draft
     - note addendum
     - open-loop update
   - Each artifact should show status, provenance/citations, confidence or uncertainty, and actions.
   - Primary action should be `commit to note` or `stage to chart`, depending on the artifact.
   - The commit action must be attached to the artifact, not buried in chat.

6. Commit/review workflow
   - The clinician can ask Pi-agent for help in the bottom chat.
   - Pi-agent generates or updates artifact cards in the right drawer.
   - The clinician reviews an artifact, edits it in the center canvas if needed, sees citations/provenance, then commits it.
   - Use clear states: draft, staged, needs review, committed.
   - Make it obvious that uncommitted agent output is not chart truth.

Clinical UX principles:

- Prioritize quick scanning over decoration.
- Use compact typography, clear hierarchy, and stable grids.
- Avoid huge hero sections, cards inside cards, decorative gradients, bokeh, or AI novelty visuals.
- Make the screen feel like a serious clinical instrument, not a consumer chatbot.
- Use restrained color. Red/accent should mean clinical attention or uncommitted/staged state.
- Treat source-of-truth boundaries as a first-class UX problem.
- Do not make clinicians hunt through chat history to find chartable content.

Prototype expectations:

- Single self-contained HTML file with embedded CSS and any lightweight JS needed for tab switching and interaction states.
- No external dependencies unless absolutely necessary.
- Include enough realistic content from the supplied prototypes to make the workflow legible.
- Create at least two visible states or interactions:
  - Overview tab selected.
  - Agent Canvas tab selected with bottom chat and right artifact scratchpad.
- If possible, make clicking an artifact update the center canvas detail.
- If possible, make `commit to note` visibly move an artifact from draft/staged to committed.

Visual target:

- 1480px wide desktop clinical workstation first.
- Should still be intelligible around 1366px wide.
- Dense but not cramped.
- Quiet, black/cream paper-like cockpit base is acceptable, but avoid making everything beige or monochrome. Use accent color sparingly and meaningfully.
- The first viewport should clearly communicate: "this is Pi-chart, a focused clinical cockpit with an agent documentation canvas."

Decision to enforce:

Do not make the right side a chat drawer. The right side is the artifact scratchpad. Chat belongs at the bottom of the Agent Canvas main area.

Design goal:

Show the best UX architecture for a clinician using Pi-agent to draft documentation while keeping Pi-chart's cockpit as the trustworthy, fast source-of-truth view.
