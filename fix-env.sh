#!/bin/bash

echo "�� .env 파일 수정 중..."

# .env 파일에서 VITE_ 변수 읽기
source .env

# API_KEY가 이미 있는지 확인
if grep -q "^API_KEY=" .env; then
  echo "⚠️  API_KEY가 이미 존재합니다."
else
  echo "" >> .env
  echo "# Node.js scripts (upload-counseling)" >> .env
  echo "API_KEY=${VITE_API_KEY}" >> .env
  echo "✅ API_KEY 추가 완료"
fi

# PINECONE_API_KEY가 이미 있는지 확인
if grep -q "^PINECONE_API_KEY=" .env; then
  echo "⚠️  PINECONE_API_KEY가 이미 존재합니다."
else
  echo "PINECONE_API_KEY=${VITE_PINECONE_API_KEY}" >> .env
  echo "✅ PINECONE_API_KEY 추가 완료"
fi

echo ""
echo "✨ .env 파일 업데이트 완료!"
echo ""
echo "확인:"
cat .env | grep -E "^(API_KEY|PINECONE_API_KEY)="
