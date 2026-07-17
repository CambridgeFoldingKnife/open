from pathlib import Path
import re
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / "画册.pdf"
OUT = ROOT / "knowledge" / "products" / "catalog.md"

def clean(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    chunks = [
        "# Theratools 2026 产品画册知识库",
        "",
        f"- 原始文件：`{SOURCE}`",
        "- 画册标题：26新画册（318更新）",
        "- 页数：60",
        "- 生成原则：按原始页码保留文字，避免多栏卡片在自动解析时把产品名、规格和价格错配。",
        "- 报价规则：本文件中的价格均为画册标价，未经价格主表审核不得用于正式自动报价。",
        "",
        "## 分类索引",
        "",
        "1. 筛查评估（画册内容页 1-6）",
        "2. 手法治疗（7-12）",
        "3. 运动治疗（13-23）",
        "4. 康复辅助（24-33）",
        "5. 运动防护（34-36）",
        "6. 骨骼教具（37-42）",
        "7. 治疗床、PT凳（43-45）",
        "8. 脊柱侧弯SPS（46-48）",
        "9. 物理因子（49-50）",
        "",
    ]
    with pdfplumber.open(SOURCE) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            text = clean(page.extract_text(x_tolerance=2, y_tolerance=3) or "")
            prices = re.findall(r"￥\s?[\d,.]+", text)
            chunks.extend([f"## PDF 第 {i} 页", "", f"价格标记数：{len(prices)}", "", "```text", text or "（本页无可提取文字，需查看原始页面）", "```", ""])
    OUT.write_text("\n".join(chunks), encoding="utf-8")
    print(f"wrote {OUT}")

if __name__ == "__main__":
    main()
