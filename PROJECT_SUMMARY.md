# 🌱 Saessak (새싹) - Project Summary

## 📌 프로젝트 개요

**Saessak**은 사용자의 감정을 분석하고 함께 성장하는 AI 반려동물 서비스입니다.

### 핵심 컨셉
- 💬 **감정 기반 성장**: 대화 내용의 감정을 분석하여 펫이 성장
- 🎨 **시각적 진화**: 레벨과 감정에 따라 실제 이미지가 변화
- 🧠 **페르소나 학습**: 시간이 지날수록 사용자를 더 잘 이해
- 🤖 **멀티 AI 모델**: 여러 AI 모델을 자유롭게 선택 가능

---

## 🎯 주요 기능

### 1. 감정 분석 시스템
- 10가지 감정 트래킹 (joy, sadness, outburst, irritable, timid, anxiety, flustered, envy, boredom, exhaustion)
- 각 대화마다 0.0~10.0 점수로 감정 자동 분석
- AI가 대화 내용을 요약하고 5-25 EXP 자동 부여

### 2. 성장 시스템
- 11단계 레벨 (Infant → Singularity)
- 경험치 누적으로 자동 레벨업
- 레벨업시 이미지 자동 생성 및 변화

### 3. AI 이미지 생성
- Gemini 2.5 Flash Image 모델 사용
- 감정별 표정 변화
- 레벨별 진화된 모습
- Base64 편집으로 연속성 유지

### 4. 자아성찰 대화
- `/pet reflect [질문]` 명령어로 심층 대화
- 감정 히스토리 기반 개인화된 답변
- 패턴 분석 및 인사이트 제공

### 5. 데이터 관리
- 백업/복원 기능 (JSON 파일)
- LocalStorage 기반 로컬 저장
- 데이터 완전 삭제 옵션

---

## 🏗️ 기술 스택

```
Frontend:  React 19 + TypeScript 5.8 + Vite 6.2
Styling:   Tailwind CSS
AI Models: Gemini, OpenAI, Anthropic, OpenRouter
Storage:   Browser LocalStorage
Security:  Client-side only, no server
```

---

## 📂 파일 구조

```
dacon_saessak/
├── 📄 Core Files
│   ├── App.tsx              # 메인 애플리케이션
│   ├── types.ts             # 타입 정의
│   ├── constants.ts         # 상수 (레벨, 감정)
│   └── imagePrompts.ts      # 이미지 프롬프트 시스템
│
├── 🎨 Components
│   ├── ChatWindow.tsx       # 대화창
│   ├── PetDashboard.tsx     # 펫 대시보드
│   ├── SettingsModal.tsx    # 설정 & 백업
│   └── ...
│
├── 🔧 Services
│   └── llmService.ts        # AI 모델 통신
│
├── 🛠️ Utils
│   └── storage.ts           # 데이터 관리
│
└── 📚 Documentation
    ├── README.md            # 메인 문서
    ├── QUICKSTART.md        # 빠른 시작
    ├── CONTRIBUTING.md      # 기여 가이드
    ├── CHANGELOG.md         # 변경 이력
    └── LICENSE              # MIT 라이선스
```

---

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일에 Gemini API 키 입력

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 열기
# http://localhost:5173
```

---

## 📊 데이터 구조

### PetState
```typescript
{
  type: 'hatchi',
  name: '해치',
  level: 1,
  exp: 0,
  dominantEmotion: 'joy',
  imageUrl: 'data:image/png;base64,...',
  logHistory: [
    {
      timestamp: '2025-11-12T...',
      summary: '대화 요약',
      emotions: { joy: 8.5, sadness: 2.3, ... }
    }
  ],
  majorEvents: [
    {
      timestamp: '2025-11-12T...',
      description: 'Level 2 도달!'
    }
  ]
}
```

---

## 🎨 이미지 생성 시스템

### 감정별 프롬프트
각 감정(joy, sadness 등)에 대해 상세한 시각적 설명 제공

### 레벨별 스타일
레벨 1: "tiny, chibi style"
레벨 10: "ultimate form, singularity aesthetic"

### 이벤트 프롬프트
- 레벨업: "glowing light, evolution energy"
- 마일스톤: "confetti, celebratory"
- 업적: "trophy, golden light"

---

## 🔐 보안 & 프라이버시

✅ **완전 로컬 저장** - 모든 데이터는 브라우저에만 저장
✅ **서버 전송 없음** - 선택한 AI 모델로만 전송
✅ **API 키 보안** - LocalStorage에 암호화 저장
✅ **사용자 통제** - 언제든 데이터 삭제 가능

---

## 🗺️ 로드맵

### v1.0 (현재) ✅
- 기본 펫 시스템
- 감정 분석 엔진
- 멀티 AI 모델 지원
- 이미지 생성
- 백업/복원

### v1.1 (계획중) 🔜
- Nano Banana 모델 통합
- 실시간 표정 변화
- 애니메이션 효과
- 다크모드

### v1.2 (미래) 🔮
- 음성 대화
- 여러 펫 관리
- 소셜 공유
- 감정 통계 심화

---

## 📈 사용 예시

### 일반 대화
```
User: "오늘 정말 힘든 하루였어"
AI: [일반 응답]
System: "Log analyzed... You gained 15 EXP!"
→ 감정 분석: sadness 7.5, exhaustion 6.8
```

### 성찰 대화
```
User: "/pet reflect 최근 내 감정은 어땠어?"
Pet: "지난 며칠간 피곤함이 많이 느껴졌어요. 
      특히 exhaustion 점수가 평균 7.2로 높았습니다.
      충분한 휴식이 필요해 보여요..."
```

---

## 🤝 기여하기

기여는 언제나 환영합니다!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md) 참조

---

## 📞 연락처

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: [Your Email]

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 🙏 감사의 말

- Google Gemini API 팀
- React & Vite 커뮤니티
- 모든 기여자와 사용자분들

---

## 🌟 특별한 점

### 1. 감정 중심 설계
단순 대화가 아닌 **감정의 깊이**로 성장

### 2. 실제 변화
숫자가 아닌 **눈으로 보이는 변화** 제공

### 3. 자아성찰 도구
AI가 **거울이 되어** 자신을 돌아보게 함

### 4. 데이터 주권
**완전한 프라이버시**와 데이터 통제권

### 5. 확장성
다양한 AI 모델로 **무한한 가능성**

---

<div align="center">

## 💚 당신의 감정과 함께 성장하는 AI 반려동물

**Made with 💚 by Team Saessak**

[⭐ Star on GitHub](https://github.com/yourusername/dacon_saessak) | 
[📖 Documentation](README.md) | 
[🚀 Quick Start](QUICKSTART.md)

</div>
