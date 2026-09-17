import { fitMenuPrintSheet } from "./menuPrintLayout";

export async function downloadMenuPdf(sourceSheet, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf")
  ]);
  const exportContainer = document.createElement("div");
  const exportSheet = sourceSheet.cloneNode(true);
  // Give html2canvas an explicitly decoded image for each badge; its inline SVG
  // renderer otherwise drops CSS-sized SVGs inside the rotated menu content.
  for (const badge of exportSheet.querySelectorAll("svg.menu-print-number")) {
    const image = document.createElement("img");
    image.className = "menu-print-number";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.width = 20;
    image.height = 20;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(badge))}`;
    badge.replaceWith(image);
  }
  Object.assign(exportContainer.style, {
    position: "fixed", top: "0", left: "-10000px", width: "210mm", height: "297mm",
    overflow: "hidden", background: "#ffffff", pointerEvents: "none"
  });
  Object.assign(exportSheet.style, {
    width: "210mm", height: "297mm", minHeight: "297mm", maxWidth: "none",
    margin: "0", padding: "0", border: "0", boxShadow: "none", background: "#ffffff"
  });
  exportContainer.appendChild(exportSheet);
  document.body.appendChild(exportContainer);
  try {
    await document.fonts?.ready;
    await Promise.all(Array.from(exportSheet.querySelectorAll("img"), (image) => image.decode().catch(() => {})));
    fitMenuPrintSheet(exportSheet);
    const canvas = await html2canvas(exportSheet, {
      backgroundColor: "#ffffff", scale: 2, scrollX: 0, scrollY: 0, useCORS: true
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const pageHeight = 297;
    const imageRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;
    const imageWidth = imageRatio > pageRatio ? pageWidth : pageHeight * imageRatio;
    const imageHeight = imageRatio > pageRatio ? pageWidth / imageRatio : pageHeight;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", (pageWidth - imageWidth) / 2, (pageHeight - imageHeight) / 2, imageWidth, imageHeight);
    pdf.save(filename);
  } finally {
    exportContainer.remove();
  }
}
