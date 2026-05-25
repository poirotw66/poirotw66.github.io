#!/bin/bash

# PDF 壓縮腳本
# 使用 Ghostscript 壓縮 PDF 檔案
# 用法: ./scripts/compress-pdf.sh input.pdf [output.pdf]

set -e

# 檢查參數
if [ $# -lt 1 ]; then
    echo "用法: $0 input.pdf [output.pdf]"
    echo "範例: $0 public/blog/07-agentic-rag/Agentic-RAG-2026.pdf"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${INPUT_FILE%.pdf}-compressed.pdf}"

# 檢查輸入檔案是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo "錯誤: 找不到檔案 $INPUT_FILE"
    exit 1
fi

# 檢查是否安裝 Ghostscript
if ! command -v gs &> /dev/null; then
    echo "錯誤: 未安裝 Ghostscript"
    echo "請執行: brew install ghostscript"
    exit 1
fi

# 取得原始檔案大小
ORIGINAL_SIZE=$(du -h "$INPUT_FILE" | cut -f1)

echo "正在壓縮 PDF..."
echo "輸入檔案: $INPUT_FILE ($ORIGINAL_SIZE)"

# 壓縮 PDF
# -dPDFSETTINGS 選項:
#   /screen   - 72 dpi, 最小檔案 (適合螢幕閱讀)
#   /ebook    - 150 dpi, 中等品質 (推薦)
#   /printer  - 300 dpi, 高品質
#   /prepress - 300 dpi, 印刷品質
gs -sDEVICE=pdfwrite \
   -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE \
   -dQUIET \
   -dBATCH \
   -dDetectDuplicateImages=true \
   -dCompressFonts=true \
   -r150 \
   -sOutputFile="$OUTPUT_FILE" \
   "$INPUT_FILE"

# 取得壓縮後檔案大小
COMPRESSED_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

# 計算壓縮率
ORIGINAL_BYTES=$(stat -f%z "$INPUT_FILE" 2>/dev/null || stat -c%s "$INPUT_FILE")
COMPRESSED_BYTES=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE")
REDUCTION=$((100 - (COMPRESSED_BYTES * 100 / ORIGINAL_BYTES)))

echo "✅ 壓縮完成!"
echo "輸出檔案: $OUTPUT_FILE ($COMPRESSED_SIZE)"
echo "壓縮率: ${REDUCTION}%"

# 詢問是否替換原檔案
if [ "$OUTPUT_FILE" != "$INPUT_FILE" ]; then
    read -p "是否替換原檔案? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv "$OUTPUT_FILE" "$INPUT_FILE"
        echo "✅ 已替換原檔案"
    fi
fi

# Made with Bob
