#!/bin/bash

# .env 파일 설정 가이드
# 이 스크립트는 .env 파일에 필요한 환경 변수를 추가합니다.

echo "📝 .env 파일 설정 가이드"
echo "========================="
echo ""
echo "현재 .env 파일을 확인합니다..."
echo ""

if [ ! -f .env ]; then
  echo "❌ .env 파일이 없습니다."
  echo "다음 명령어로 생성하세요:"
  echo "  cp .env.example .env"
  exit 1
fi

echo "✅ .env 파일이 존재합니다."
echo ""
echo "다음 내용을 .env 파일에 추가해주세요:"
echo ""
echo "# Node.js 스크립트용 (upload-counseling)"
echo "API_KEY=<VITE_API_KEY와 동일한 값>"
echo "PINECONE_API_KEY=<VITE_PINECONE_API_KEY와 동일한 값>"
echo ""
echo "예시:"
echo "VITE_API_KEY=AIzaSyCJqA1GUnKR9..."
echo "API_KEY=AIzaSyCJqA1GUnKR9...            # 같은 값"
echo ""
echo "VITE_PINECONE_API_KEY=pcsk_LfWwR..."
echo "PINECONE_API_KEY=pcsk_LfWwR...          # 같은 값"
echo ""
echo "========================="
echo ""
echo "수정 방법:"
echo "  nano .env"
echo "또는"
echo "  vim .env"
echo ""
