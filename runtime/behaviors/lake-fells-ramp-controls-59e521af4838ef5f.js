export default async function install(app) {
  const mount = app.getMount("ramp-controls");
  const cfg = app.config;
  const layer = app.layers[cfg.layerId];
  app.assert(layer, "LakeDistrictFells layer is not available for styling.");
  await layer.load();

  const ramps = {
    "Blue to red": ["#2c7bb6", "#ffffbf", "#d7191c"],
    "Purple to orange": ["#542788", "#f7f7f7", "#fdb863"],
    "Green to magenta": ["#1a9850", "#ffffbf", "#d73027"],
    "Teal to rose": ["#008080", "#f6e8c3", "#c51b7d"],
    "Custom": ["#2c7bb6", "#ffffbf", "#d7191c"]
  };

  const state = { rampName: "Blue to red", colors: ramps["Blue to red"].slice() };
  const minProm = Number(cfg.minProminence);
  const maxProm = Number(cfg.maxProminence);
  const midProm = minProm + (maxProm - minProm) / 2;
  const minHeight = Number(cfg.minHeight);
  const maxHeight = Number(cfg.maxHeight);

  const root = document.createElement("div");
  root.style.display = "grid";
  root.style.gap = "12px";
  root.style.font = "13px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  root.style.color = "var(--calcite-ui-text-1, #1f1f1f)";

  const intro = document.createElement("p");
  intro.textContent = "Change the prominence color ramp. Height continues to control triangle size.";
  intro.style.margin = "0";
  intro.style.lineHeight = "1.35";
  root.appendChild(intro);

  const label = document.createElement("label");
  label.textContent = "Ramp";
  label.style.display = "grid";
  label.style.gap = "6px";
  const select = document.createElement("select");
  select.style.width = "100%";
  select.style.padding = "6px";
  for (const name of Object.keys(ramps)) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }
  label.appendChild(select);
  root.appendChild(label);

  const sample = document.createElement("div");
  sample.style.height = "22px";
  sample.style.borderRadius = "6px";
  sample.style.border = "1px solid rgba(0,0,0,.25)";
  root.appendChild(sample);

  const colorGrid = document.createElement("div");
  colorGrid.style.display = "grid";
  colorGrid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  colorGrid.style.gap = "8px";
  const inputs = [];
  const names = ["Low", "Mid", "High"];
  for (let i = 0; i < 3; i++) {
    const wrap = document.createElement("label");
    wrap.style.display = "grid";
    wrap.style.gap = "4px";
    const span = document.createElement("span");
    span.textContent = names[i];
    span.style.fontSize = "12px";
    const input = document.createElement("input");
    input.type = "color";
    input.value = state.colors[i];
    input.style.width = "100%";
    input.style.height = "32px";
    inputs.push(input);
    wrap.append(span, input);
    colorGrid.appendChild(wrap);
  }
  root.appendChild(colorGrid);

  const readout = document.createElement("div");
  readout.style.display = "grid";
  readout.style.gap = "5px";
  root.appendChild(readout);

  function stopRow(labelText, value, color) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "20px 1fr";
    row.style.gap = "8px";
    row.style.alignItems = "center";
    const chip = document.createElement("span");
    chip.style.width = "18px";
    chip.style.height = "18px";
    chip.style.borderRadius = "50%";
    chip.style.border = "1px solid rgba(0,0,0,.25)";
    chip.style.background = color;
    const txt = document.createElement("span");
    txt.textContent = `${labelText}: ${Math.round(value)} m`;
    row.append(chip, txt);
    return row;
  }

  function renderReadout() {
    sample.style.background = `linear-gradient(90deg, ${state.colors[0]}, ${state.colors[1]}, ${state.colors[2]})`;
    readout.replaceChildren(
      stopRow("Low prominence", minProm, state.colors[0]),
      stopRow("Mid prominence", midProm, state.colors[1]),
      stopRow("High prominence", maxProm, state.colors[2])
    );
  }

  function applyRenderer() {
    const c = state.colors;
    layer.renderer = {
      type: "simple",
      label: "Fells: prominence color, height size",
      symbol: {
        type: "simple-marker",
        style: "triangle",
        color: [255, 255, 255, 0.9],
        size: 10,
        outline: { color: [35, 35, 35, 0.85], width: 0.7 }
      },
      visualVariables: [
        {
          type: "color",
          field: cfg.prominenceField,
          legendOptions: { title: "Prominence (m)" },
          stops: [
            { value: minProm, color: c[0], label: `${Math.round(minProm)} m` },
            { value: midProm, color: c[1], label: `${Math.round(midProm)} m` },
            { value: maxProm, color: c[2], label: `${Math.round(maxProm)} m` }
          ]
        },
        {
          type: "size",
          field: cfg.heightField,
          legendOptions: { title: "Height (m)" },
          minDataValue: minHeight,
          maxDataValue: maxHeight,
          minSize: 7,
          maxSize: 24
        }
      ]
    };
    layer.opacity = 0.9;
    layer.refresh();
    renderReadout();
  }

  select.addEventListener("change", () => {
    state.rampName = select.value;
    state.colors = ramps[select.value].slice();
    inputs.forEach((input, idx) => { input.value = state.colors[idx]; });
    applyRenderer();
  });

  inputs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      state.rampName = "Custom";
      select.value = "Custom";
      state.colors[idx] = input.value;
      ramps.Custom = state.colors.slice();
      applyRenderer();
    });
  });

  const note = document.createElement("p");
  note.textContent = `Using ${cfg.heightField} for size and ${cfg.prominenceField} for color.`;
  note.style.margin = "0";
  note.style.fontSize = "12px";
  note.style.color = "var(--calcite-ui-text-2, #555)";
  root.appendChild(note);

  renderReadout();
  mount.replaceChildren(root);
  app.onCleanup(() => mount.replaceChildren());
}