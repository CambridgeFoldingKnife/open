import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 将指定 DOM 元素导出为多页 PDF
 * 原理：html2canvas 全高度截图 → jsPDF 按 A4 分页
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const A4_WIDTH = 210; // mm
  const A4_HEIGHT = 297; // mm
  const MARGIN = 8; // mm，页边距

  // 等待外部字体加载完成（Google Fonts 的 Plus Jakarta Sans）
  await document.fonts.ready;

  // 导出期间隐藏交互元素
  element.classList.add('pdf-exporting');

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2, // 2x 高清
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      logging: false,
    });
  } finally {
    element.classList.remove('pdf-exporting');
  }

  const imgData = canvas.toDataURL('image/png');
  const pageWidth = A4_WIDTH - MARGIN * 2;
  const pageHeight = A4_HEIGHT - MARGIN * 2;
  const imgFullHeight = (canvas.height * pageWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');

  // 超过一页则分页裁切
  if (imgFullHeight <= pageHeight) {
    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, pageWidth, imgFullHeight);
  } else {
    let srcY = 0;
    let firstPage = true;

    while (srcY < imgFullHeight) {
      const sliceHeight = Math.min(pageHeight, imgFullHeight - srcY);

      // 创建裁切 canvas
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.round(
        (sliceHeight / imgFullHeight) * canvas.height,
      );
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.drawImage(
        canvas,
        0,
        Math.round((srcY / imgFullHeight) * canvas.height),
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height,
      );

      if (!firstPage) pdf.addPage();
      firstPage = false;
      pdf.addImage(
        sliceCanvas.toDataURL('image/png'),
        'PNG',
        MARGIN,
        MARGIN,
        pageWidth,
        sliceHeight,
      );

      srcY += sliceHeight;
    }
  }

  pdf.save(`${filename}.pdf`);
}
