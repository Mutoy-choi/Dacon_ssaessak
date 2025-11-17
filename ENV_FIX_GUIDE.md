# ⚠️ .env 파일 수정 필요!

## 🔴 문제
Node.js 스크립트(`upload-counseling`)는 `VITE_` 접두사 없는 환경 변수를 사용합니다.

## ✅ 해결 방법

### 옵션 1: 수동으로 .env 파일 수정

`.env` 파일을 열어서:
```bash
nano .env
# 또는
vim .env
```

다음 줄을 추가하세요 (VITE_ 값과 동일하게):
```bash
# 기존
VITE_API_KEY=AIzaSyCJqA1GUnKR9XCMMCbGw7mksNwQUcAtda8
VITE_PINECONE_API_KEY=pcsk_LfWwR_L8pgvMbi2z7ad3Kcehbmi2uy3NWjkdkiFjcDbRUtdudjyyMF16bMtuv23EihX25

# 추가 (위와 같은 값)
API_KEY=AIzaSyCJqA1GUnKR9XCMMCbGw7mksNwQUcAtda8
PINECONE_API_KEY=pcsk_LfWwR_L8pgvMbi2z7ad3Kcehbmi2uy3NWjkdkiFjcDbRUtdudjyyMF16bMtuv23EihX25
```

### 옵션 2: 명령어로 추가

```bash
cd /home/jant/workspace/dacon/sesak/Dacon_ssaessak

# API_KEY 추가 (실제 키 값으로 교체)
echo "API_KEY=AIzaSyCJqA1GUnKR9XCMMCbGw7mksNwQUcAtda8" >> .env

# PINECONE_API_KEY 추가 (실제 키 값으로 교체)
echo "PINECONE_API_KEY=pcsk_LfWwR_L8pgvMbi2z7ad3Kcehbmi2uy3NWjkdkiFjcDbRUtdudjyyMF16bMtuv23EihX25" >> .env
```

### 옵션 3: 기존 값 복사

```bash
# .env 파일의 VITE_API_KEY 값을 확인
grep VITE_API_KEY .env

# 그 값을 API_KEY로 추가
echo "API_KEY=<위에서 확인한 값>" >> .env
echo "PINECONE_API_KEY=<위에서 확인한 값>" >> .env
```

## 🚀 수정 후 실행

```bash
npm run upload-counseling
```

---

## 📝 참고

- **VITE_** 접두사: 브라우저/Vite 환경에서 사용
- **일반 이름**: Node.js 스크립트에서 사용
- 두 개 모두 필요: 웹앱(VITE_)과 스크립트(일반) 동시 지원
