#!/bin/bash

# 批次壓縮所有 PDF 檔案
# 用法: ./scripts/compress-all-pdfs.sh

set -e

echo "🔍 搜尋所有 PDF 檔案..."

# 找出所有 PDF 檔案
PDF_FILES=$(find public/blog -name "*.pdf" -type f)

if [ -z "$PDF_FILES" ]; then
    echo "❌ 未找到任何 PDF 檔案"
    exit 0
fi

# 計算總數
TOTAL=$(echo "$PDF_FILES" | wc -l | tr -d ' ')
CURRENT=0
TOTAL_ORIGINAL=0
TOTAL_COMPRESSED=0

echo "📦 找到 $TOTAL 個 PDF 檔案"
echo ""

# 處理每個 PDF
while IFS= read -r pdf; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL] 處理: $pdf"
    
    # 取得原始大小
    ORIGINAL_BYTES=$(stat -f%z "$pdf" 2>/dev/null || stat -c%s "$pdf")
    TOTAL_ORIGINAL=$((TOTAL_ORIGINAL + ORIGINAL_BYTES))
    
    # 壓縮 PDF
    TEMP_FILE="${pdf%.pdf}-temp.pdf"
    
    gs -sDEVICE=pdfwrite \
       -dCompatibilityLevel=1.4 \
       -dPDFSETTINGS=/ebook \
       -dNOPAUSE \
       -dQUIET \
       -dBATCH \
       -dDetectDuplicateImages=true \
       -dCompressFonts=true \
       -r150 \
       -sOutputFile="$TEMP_FILE" \
       "$pdf" 2>/dev/null
    
    # 取得壓縮後大小
    COMPRESSED_BYTES=$(stat -f%z "$TEMP_FILE" 2>/dev/null || stat -c%s "$TEMP_FILE")
    TOTAL_COMPRESSED=$((TOTAL_COMPRESSED + COMPRESSED_BYTES))
    
    # 計算壓縮率
    REDUCTION=$((100 - (COMPRESSED_BYTES * 100 / ORIGINAL_BYTES)))
    
    # 只有在壓縮有效時才替換
    if [ $COMPRESSED_BYTES -lt $ORIGINAL_BYTES ]; then
        mv "$TEMP_FILE" "$pdf"
        echo "  ✅ 壓縮 ${REDUCTION}% ($(numfmt --to=iec $ORIGINAL_BYTES) → $(numfmt --to=iec $COMPRESSED_BYTES))"
    else
        rm "$TEMP_FILE"
        echo "  ⏭️  跳過 (壓縮後更大)"
    fi
    
    echo ""
done <<< "$PDF_FILES"

# 顯示總結
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 壓縮總結"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "處理檔案數: $TOTAL"
echo "原始總大小: $(numfmt --to=iec $TOTAL_ORIGINAL)"
echo "壓縮後大小: $(numfmt --to=iec $TOTAL_COMPRESSED)"

if [ $TOTAL_ORIGINAL -gt 0 ]; then
    TOTAL_REDUCTION=$((100 - (TOTAL_COMPRESSED * 100 / TOTAL_ORIGINAL)))
    SAVED=$((TOTAL_ORIGINAL - TOTAL_COMPRESSED))
    echo "總壓縮率: ${TOTAL_REDUCTION}%"
    echo "節省空間: $(numfmt --to=iec $SAVED)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 完成!"

# Made with Bob
