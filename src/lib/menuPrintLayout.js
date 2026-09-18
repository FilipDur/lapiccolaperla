// Fit the list into its print area for the preview, browser print and PDF export.
export function fitMenuPrintSheet(sheet) {
  if (!sheet) return;
  if (sheet.dataset.printLayout === "single-a4") {
    sheet.style.setProperty("--special-page-scale", String(sheet.clientWidth / (210 * 96 / 25.4)));
  }
  for (const list of sheet.querySelectorAll("[data-menu-print-fit]")) {
    const availableHeight = list.parentElement.clientHeight - 2;
    if (availableHeight <= 0) continue;
    const setScale = (scale) => list.style.setProperty("--menu-print-scale", String(scale));
    const fits = () => Math.max(list.scrollHeight, list.offsetHeight) <= availableHeight;
    setScale(1);
    if (fits()) continue;
    let minimum = 0.1;
    let maximum = 1;
    for (let step = 0; step < 12; step += 1) {
      const middle = (minimum + maximum) / 2;
      setScale(middle);
      if (fits()) minimum = middle;
      else maximum = middle;
    }
    setScale(minimum);
  }
}
