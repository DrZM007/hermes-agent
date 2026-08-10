// Notebook — NotebookLM-style grounded Q&A over your own notes.
//
// Pick which notes are "sources", ask a question (or run a studio action), and
// get an answer that cites the exact passages it used. Answers are grounded:
// the server ranks your note chunks against the question and the model may only
// use those passages. Without an API key it degrades to showing the matching
// passages verbatim rather than inventing prose — your notes are your record.

import { h, clear } from "../utils.js";

const TASKS = [
  ["ask", "Ask"],
  ["summary", "Summarise"],
  ["keypoints", "Key points"],
  ["questions", "Open questions"],
  ["studyguide", "Study guide"],
];

const noteTitle = (note) =>
  (note.text || "").split("\n")[0].trim().slice(0, 60) || "(untitled note)";

export default {
  type: "notebook",
  title: "Notebook",
  icon: "📓",
  defaultSize: "l",

  render(body, ctx) {
    const { store } = ctx;
    const nb = () => store.state.notebook || {};
    const persist = (patch) =>
      store.update((s) => { s.notebook = { ...(s.notebook || {}), ...patch }; }, "notebook");

    let busy = false;
    let result = null;      // { answer, passages, mode }

    const notes = () => store.state.notes?.items || [];
    const selectedIds = () => {
      const sel = nb().selected;
      // default: everything is a source until the user narrows it
      return Array.isArray(sel) ? sel : notes().map((n) => n.id);
    };

    const draw = () => {
      const ids = new Set(selectedIds());
      const all = notes();

      // ---- sources ----
      const sourceList = h("div.nb-sources");
      for (const note of all) {
        const row = h("label.nb-source", {});
        const cb = h("input", { type: "checkbox", checked: ids.has(note.id) });
        cb.addEventListener("change", () => {
          const next = new Set(selectedIds());
          if (cb.checked) next.add(note.id); else next.delete(note.id);
          persist({ selected: [...next] });
        });
        row.append(cb, h("span.nb-source-title", {}, noteTitle(note)));
        sourceList.append(row);
      }
      if (!all.length) {
        sourceList.append(h("div.muted.small", {},
          "No notes yet — add some in the Notes widget and they become sources here."));
      }

      const selectAll = h("button.link-btn", { type: "button" },
        ids.size === all.length ? "none" : "all");
      selectAll.addEventListener("click", () => {
        persist({ selected: ids.size === all.length ? [] : all.map((n) => n.id) });
        draw();
      });

      // ---- question + actions ----
      const input = h("input.input.nb-q", { type: "text", value: nb().question || "",
        placeholder: "Ask your notes…", "aria-label": "Ask your notes" });
      input.addEventListener("input", () => persist({ question: input.value }));
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") run("ask"); });

      const actions = h("div.nb-actions", {}, TASKS.map(([task, label]) => {
        const b = h("button.btn.btn-tiny", {
          type: "button",
          class: task === "ask" ? "btn btn-tiny btn-primary" : "btn btn-tiny",
        }, label);
        b.addEventListener("click", () => run(task));
        return b;
      }));

      const output = h("div.nb-output");

      const renderResult = () => {
        clear(output);
        if (busy) { output.append(h("div.widget-loading", {}, "READING YOUR NOTES…")); return; }
        if (!result) {
          output.append(h("div.muted.small", {},
            "Answers cite the passages they came from, and only use the notes you select."));
          return;
        }
        // Turn [n] markers into chips that reveal the cited passage.
        const answer = h("div.nb-answer");
        const parts = String(result.answer).split(/(\[\d+\])/g);
        for (const part of parts) {
          const m = part.match(/^\[(\d+)\]$/);
          if (!m) { answer.append(document.createTextNode(part)); continue; }
          const idx = Number(m[1]) - 1;
          const passage = result.passages[idx];
          const chip = h("button.nb-cite", { type: "button",
            title: passage ? `${passage.title} — click to show` : "unknown source" }, part);
          chip.addEventListener("click", () => {
            const box = output.querySelector(`.nb-passage[data-idx="${idx}"]`);
            if (box) { box.hidden = !box.hidden; box.scrollIntoView({ block: "nearest" }); }
          });
          answer.append(chip);
        }
        output.append(answer);

        if (result.passages.length) {
          output.append(h("div.nb-sources-label", {}, "SOURCES"));
          result.passages.forEach((p, i) => {
            const toggle = h("button.nb-passage-toggle", { type: "button" },
              `[${i + 1}] ${p.title}`);
            const box = h("div.nb-passage", { hidden: true, dataset: { idx: String(i) } }, p.text);
            toggle.addEventListener("click", () => { box.hidden = !box.hidden; });
            output.append(toggle, box);
          });
        }
        if (result.mode === "extractive") {
          output.append(h("div.muted.small.nb-mode", {},
            "No model configured — showing your own passages verbatim rather than generating prose."));
        }
        const save = h("button.btn.btn-tiny.nb-save", { type: "button" }, "Save as note");
        save.addEventListener("click", () => {
          const stamp = new Date().toISOString().slice(0, 10);
          store.update((s) => {
            s.notes.items.unshift({
              id: `nb-${Date.now()}`,
              text: `Notebook — ${nb().question || "summary"} (${stamp})\n\n${result.answer}`,
              updated: new Date().toISOString(),
            });
          }, "notes-external");
          ctx.card?.dispatchEvent(new CustomEvent("hub:toast"));
          draw();
        });
        output.append(save);
      };

      const run = async (task) => {
        const question = (nb().question || "").trim();
        if (task === "ask" && !question) return;
        const chosen = notes().filter((n) => new Set(selectedIds()).has(n.id));
        if (!chosen.length) { result = { answer: "Select at least one note as a source.", passages: [], mode: "extractive" }; renderResult(); return; }
        busy = true; renderResult();
        try {
          result = await ctx.api.notebookAsk({
            question, task,
            sources: chosen.map((n) => ({ id: n.id, title: noteTitle(n), text: n.text || "" })),
          });
        } catch (err) {
          result = { answer: `Notebook unavailable: ${err.message}`, passages: [], mode: "error" };
        } finally {
          busy = false; renderResult();
        }
      };

      clear(body).append(
        h("div.nb-head", {},
          h("span.nb-label", {}, `SOURCES (${ids.size}/${all.length})`), selectAll),
        sourceList, input, actions, output);
      renderResult();
    };

    ctx.onRefresh(draw);
    ctx.onStore((topic) => { if (topic === "notes" || topic === "notes-external" || topic === "replace") draw(); });
    draw();
  },
};
